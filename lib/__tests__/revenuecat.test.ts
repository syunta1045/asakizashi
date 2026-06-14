jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

import { planFromProductIdentifier } from "../revenuecat";

describe("revenuecat", () => {
  test("planFromProductIdentifier detects yearly and monthly products", () => {
    expect(planFromProductIdentifier("premium_yearly")).toBe("premium_yearly");
    expect(planFromProductIdentifier("asakizashi_annual_3800")).toBe("premium_yearly");
    expect(planFromProductIdentifier("premium_monthly")).toBe("premium_monthly");
    expect(planFromProductIdentifier("asakizashi_month_480")).toBe("premium_monthly");
  });

  test("planFromProductIdentifier returns undefined for unknown values", () => {
    expect(planFromProductIdentifier("premium")).toBeUndefined();
    expect(planFromProductIdentifier(null)).toBeUndefined();
  });
});
