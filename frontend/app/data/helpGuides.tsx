
import type { MCPClientGuide } from "../components/help/types";

const MCP_ENDPOINT = "https://finora-mcp.onrender.com/mcp";

export const helpGuides: MCPClientGuide[] = [
  {
    id: "claude",
    name: "Claude",
    description: "Connect Finora to Claude using a remote MCP connection.",
    endpoint: MCP_ENDPOINT,

    steps: [
      {
        title: "Open Claude settings",
        description:
          "Open Claude and navigate to the settings area where you can manage integrations or connectors.",
        image: "/images/help/claude/step-1.png",
        tip: "Make sure you're signed in to the Claude account you want to use.",
      },
      {
        title: "Find custom connectors",
        description:
          "Locate the option for adding a custom remote MCP connector.",
        image: "/images/help/claude/step-2.png",
      },
      {
        title: "Add Finora",
        description:
          "Enter Finora as the connector name and provide its MCP server endpoint.",
        image: "/images/help/claude/step-3.png",
      },
      {
        title: "Authorize the connection",
        description:
          "Follow the authentication flow presented by Claude to authorize access to Finora.",
        image: "/images/help/claude/step-4.png",
        tip: "Review the requested permissions before authorizing.",
      },
      {
        title: "Start using Finora",
        description:
          "Once connected, check that Finora's available tools appear and try an example prompt.",
        image: "/images/help/claude/step-5.png",
      },
    ],

    examplePrompts: [
      "Show my expenses this month.",
      "Give me a summary of my spending by category.",
      "Compare my spending across the last three months.",
      "Add ₹250 for groceries today.",
    ],
  },

  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Connect Finora to ChatGPT through its MCP app integration.",
    endpoint: MCP_ENDPOINT,

    steps: [
      {
        title: "Stay on Gpt dashboard",
        description:
          "you will see plugins options on left sidebar",
        image: "/images/help/chatgpt/step-1.png",
      },
      {
        title: "Click on the Add button",
        description:
          "You will see a dropdown ,select Add coustom MCP server",
        image: "/images/help/chatgpt/step-2.png",
      },
      {
        title: "Configure Finora",
        description:
          "Enter Finora as the app name and provide the MCP server endpoint.",
        image: "/images/help/chatgpt/step-3.png",
      },
      {
        title: "Complete authorization",
        description:
          "Follow the authentication and authorization instructions shown by ChatGPT.",
        image: "/images/help/chatgpt/step-4.png",
      },
      {
        title: "Start using Finora",
        description:
          "Verify the connection and try one of the example prompts.",
        image: "/images/help/chatgpt/step-5.png",
      },
    ],

    examplePrompts: [
      "Show my expenses this month.",
      "How much did I spend in each category?",
      "Show my monthly spending trend.",
      "Add ₹500 for transportation today.",
    ],

    notes: [
      "MCP app availability and capabilities depend on your ChatGPT plan and workspace settings.",
      "Verify that the authentication flow is compatible with Finora before publishing this walkthrough.",
    ],
  },
];
