import fs from "fs";
import { loadConfig } from "../lib/config";

jest.mock("fs");
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>;

const VALID_YAML = `
brandName: Acme Corp
tagline: Building the future
ctaText: Get Started
successMessage: Thanks for signing up!
colors:
  primary: "#ff6600"
  background: "#ffffff"
  text: "#333333"
logoUrl: https://example.com/logo.png
apiUrl: https://api.example.com
`;

describe("loadConfig", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads and parses config.yaml correctly", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);

    const config = loadConfig();

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(config).toBeDefined();
    expect(config.brandName).toBe("Acme Corp");
  });

  it("throws when config.yaml is missing", () => {
    const err: NodeJS.ErrnoException = new Error(
      "ENOENT: no such file or directory"
    );
    err.code = "ENOENT";
    mockReadFileSync.mockImplementation(() => {
      throw err;
    });

    expect(() => loadConfig()).toThrow("ENOENT");
  });

  it("deep merges partial color overrides with defaults", () => {
    const partialYaml = `
brandName: Test
tagline: Test
ctaText: Go
successMessage: Done
colors:
  primary: "#00ff00"
logoUrl: null
apiUrl: https://api.test.com
`;
    mockReadFileSync.mockReturnValue(partialYaml);

    const config = loadConfig();

    expect(config.colors.primary).toBe("#00ff00");
    expect(config.colors.accent).toBe("#E8A84C");
    expect(config.colors.background).toBe("#09090B");
    expect(config.colors.surface).toBe("#13131A");
    expect(config.colors.text).toBe("#EDE9E1");
    expect(config.colors.textMuted).toBe("#7A756E");
  });

  it("parses all fields correctly", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);

    const config = loadConfig();

    expect(config.brandName).toBe("Acme Corp");
    expect(config.tagline).toBe("Building the future");
    expect(config.ctaText).toBe("Get Started");
    expect(config.successMessage).toBe("Thanks for signing up!");
    expect(config.colors).toEqual({
      primary: "#ff6600",
      accent: "#E8A84C",
      background: "#ffffff",
      surface: "#13131A",
      text: "#333333",
      textMuted: "#7A756E",
    });
    expect(config.logoUrl).toBe("https://example.com/logo.png");
    expect(config.apiUrl).toBe("https://api.example.com");
  });
});
