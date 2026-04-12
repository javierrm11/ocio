import { describe, it, expect, beforeEach } from "vitest";
import { getToken } from "@/lib/hooks/getToken";

// happy-dom provides document.cookie; we reset it before each test.
function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    document.cookie = `${name}=; max-age=0; path=/`;
  });
}

beforeEach(clearCookies);

describe("getToken (session indicator)", () => {
  it("returns null when no session cookie is present", () => {
    expect(getToken()).toBeNull();
  });

  it("returns a truthy value when session=1 is set", () => {
    document.cookie = "session=1; path=/";
    expect(getToken()).toBeTruthy();
  });

  it("returns the exact cookie value", () => {
    document.cookie = "session=1; path=/";
    expect(getToken()).toBe("1");
  });

  it("returns null after the session cookie is cleared (max-age=0)", () => {
    document.cookie = "session=1; path=/";
    expect(getToken()).toBeTruthy();

    document.cookie = "session=; max-age=0; path=/";
    expect(getToken()).toBeNull();
  });

  it("is not affected by other unrelated cookies", () => {
    document.cookie = "other=value; path=/";
    expect(getToken()).toBeNull();
  });

  it("still works when other cookies exist alongside the session cookie", () => {
    document.cookie = "other=value; path=/";
    document.cookie = "session=1; path=/";
    expect(getToken()).toBe("1");
  });
});
