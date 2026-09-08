import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement scrolling APIs, but components may use them after
// rendering new content in a real browser.
Element.prototype.scrollIntoView = vi.fn();
