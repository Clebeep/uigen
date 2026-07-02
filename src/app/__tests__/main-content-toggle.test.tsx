import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MainContent } from "../main-content";

// Mock the ResizablePanelGroup and related components
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className} data-testid="resizable-panel-group">
      {children}
    </div>
  ),
  ResizablePanel: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="resizable-panel" {...props}>
      {children}
    </div>
  ),
  ResizableHandle: ({ className }: any) => (
    <div className={className} data-testid="resizable-handle" />
  ),
}));

// Mock the PreviewFrame component
vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Content</div>,
}));

// Mock the CodeEditor component
vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor Content</div>,
}));

// Mock the FileTree component
vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

// Mock the ChatInterface
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

// Mock the HeaderActions
vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

// Mock the contexts
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders both Preview and Code toggle buttons", () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: /preview/i });
  const codeButton = screen.getByRole("tab", { name: /code/i });

  expect(previewButton).toBeDefined();
  expect(codeButton).toBeDefined();
});

test("shows Preview content by default (initial state)", () => {
  render(<MainContent />);

  // Preview should be the active tab by default
  const previewButton = screen.getByRole("tab", { name: /preview/i });
  expect(previewButton.getAttribute("data-state")).toBe("active");

  // Code should be inactive
  const codeButton = screen.getByRole("tab", { name: /code/i });
  expect(codeButton.getAttribute("data-state")).toBe("inactive");

  // PreviewFrame should be visible
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Code editor and file tree should NOT be visible
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("clicking Code tab switches to Code view", async () => {
  render(<MainContent />);

  const codeButton = screen.getByRole("tab", { name: /code/i });

  // Click the Code tab
  fireEvent.click(codeButton);

  // Code tab should now be active
  expect(codeButton.getAttribute("data-state")).toBe("active");

  // Preview tab should be inactive
  const previewButton = screen.getByRole("tab", { name: /preview/i });
  expect(previewButton.getAttribute("data-state")).toBe("inactive");

  // Code editor and file tree should be visible
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();

  // PreviewFrame should NOT be visible
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Preview tab switches back from Code to Preview", async () => {
  render(<MainContent />);

  // First switch to Code
  const codeButton = screen.getByRole("tab", { name: /code/i });
  fireEvent.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");

  // Now switch back to Preview
  const previewButton = screen.getByRole("tab", { name: /preview/i });
  fireEvent.click(previewButton);

  // Preview should be active again
  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(codeButton.getAttribute("data-state")).toBe("inactive");

  // PreviewFrame should be visible again
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggling multiple times maintains correct state", async () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: /preview/i });
  const codeButton = screen.getByRole("tab", { name: /code/i });

  // Toggle: Code -> Preview -> Code -> Preview -> Code
  fireEvent.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("code-editor")).toBeDefined();

  fireEvent.click(previewButton);
  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  fireEvent.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("code-editor")).toBeDefined();

  fireEvent.click(previewButton);
  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  fireEvent.click(codeButton);
  expect(codeButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("code-editor")).toBeDefined();
});

test("clicking already-active Preview tab keeps it active", async () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: /preview/i });

  // Preview starts active
  expect(previewButton.getAttribute("data-state")).toBe("active");

  // Click Preview again (it's already active)
  fireEvent.click(previewButton);

  // Should still be active
  expect(previewButton.getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});

test("toggle buttons have correct ARIA attributes for accessibility", () => {
  render(<MainContent />);

  const tabsRoot = screen.getByRole("tablist");
  expect(tabsRoot).toBeDefined();

  const previewButton = screen.getByRole("tab", { name: /preview/i });
  expect(previewButton.getAttribute("aria-selected")).toBe("true");

  const codeButton = screen.getByRole("tab", { name: /code/i });
  expect(codeButton.getAttribute("aria-selected")).toBe("false");
});

test("toggle buttons are keyboard accessible with space/enter", async () => {
  render(<MainContent />);

  const codeButton = screen.getByRole("tab", { name: /code/i });

  // Activate Code tab with keyboard
  fireEvent.keyDown(codeButton, { key: "Enter" });
  expect(codeButton.getAttribute("data-state")).toBe("active");

  // Switch back to Preview with keyboard
  const previewButton = screen.getByRole("tab", { name: /preview/i });
  fireEvent.keyDown(previewButton, { key: " " }); // Space
  expect(previewButton.getAttribute("data-state")).toBe("active");
});

test("toggle buttons have cursor-pointer class for click affordance", () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: /preview/i });
  const codeButton = screen.getByRole("tab", { name: /code/i });

  expect(previewButton.className).toContain("cursor-pointer");
  expect(codeButton.className).toContain("cursor-pointer");
});

test("toggle buttons have transition-colors (not transition-all) for responsive feel", () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: /preview/i });
  const codeButton = screen.getByRole("tab", { name: /code/i });

  // Should use transition-colors for snappy feedback, not transition-all
  expect(previewButton.className).toContain("transition-colors");
  expect(previewButton.className).not.toContain("transition-all");

  expect(codeButton.className).toContain("transition-colors");
  expect(codeButton.className).not.toContain("transition-all");
});
