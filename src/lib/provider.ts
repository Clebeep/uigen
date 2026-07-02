import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-zinc-900">Get in touch</h2>
        <p className="text-zinc-500 mt-2 text-sm">We'd love to hear from you. Send us a message.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-zinc-700 mb-1.5 tracking-wide uppercase text-xs">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 text-zinc-800 placeholder-zinc-400"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 mb-1.5 tracking-wide uppercase text-xs">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 text-zinc-800 placeholder-zinc-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-zinc-700 mb-1.5 tracking-wide uppercase text-xs">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200 text-zinc-800 placeholder-zinc-400 resize-none"
            placeholder="Tell us about your project..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98] tracking-wide"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React from 'react';

const Card = ({
  title = "Premium Plan",
  description = "Everything you need to scale your workflow. Includes advanced analytics, priority support, and custom integrations.",
  price = "$49",
  period = "/month",
  features = [
    "Unlimited projects",
    "Advanced analytics",
    "Priority support 24/7",
    "Custom integrations",
    "Team collaboration",
  ],
  highlighted = false,
  actions
}) => {
  return (
    <div className={\`relative group rounded-2xl overflow-hidden transition-all duration-300 \${
      highlighted
        ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl shadow-purple-500/25 scale-105'
        : 'bg-gradient-to-b from-zinc-900 to-zinc-800 shadow-xl shadow-zinc-900/10 hover:scale-[1.02]'
    }\`}>
      {/* Decorative top accent */}
      <div className={\`h-1 w-full \${
        highlighted ? 'bg-gradient-to-r from-amber-400 to-pink-400' : 'bg-gradient-to-r from-teal-400 to-emerald-400'
      }\`} />

      <div className="p-8">
        {/* Title & price */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className={\`text-xl font-bold tracking-tight \${
              highlighted ? 'text-white' : 'text-zinc-100'
            }\`}>{title}</h3>
            <p className={\`text-sm mt-1 \${
              highlighted ? 'text-purple-200' : 'text-zinc-400'
            }\`}>{description.substring(0, 60)}...</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className={\`text-5xl font-black tracking-tight \${
            highlighted ? 'text-white' : 'text-zinc-100'
          }\`}>{price}</span>
          <span className={\`text-lg ml-1 \${
            highlighted ? 'text-purple-200' : 'text-zinc-500'
          }\`}>{period}</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <svg className={\`w-5 h-5 flex-shrink-0 \${
                highlighted ? 'text-amber-400' : 'text-emerald-400'
              }\`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className={\`text-sm \${
                highlighted ? 'text-purple-100' : 'text-zinc-300'
              }\`}>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        {actions && (
          <div className="mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center">
      {/* Display card */}
      <div className="bg-zinc-900 rounded-3xl p-10 shadow-2xl shadow-zinc-900/20 mb-6">
        <p className="text-zinc-500 text-sm font-semibold tracking-widest uppercase text-center mb-3">Count</p>
        <div className="text-7xl font-black text-white tabular-nums tracking-tight text-center">
          {count}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setCount(prev => prev - 1)}
          className="w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-2xl transition-all duration-200 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 active:scale-95 flex items-center justify-center"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-5 h-14 rounded-2xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center tracking-wide uppercase"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(prev => prev + 1)}
          className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return "<span className={`text-lg ml-1 ${highlighted ? 'text-purple-200' : 'text-zinc-500'}`}>{period}</span>";
      default:
        return "  const [count, setCount] = useState(0);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "card":
        return "<span className={`text-lg ml-1 ${highlighted ? 'text-purple-200' : 'text-zinc-500'}`}>{period}</span>\n        {highlighted && (\n          <span className=\"ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-zinc-900\">\n            POPULAR\n          </span>\n        )}";
      default:
        return "  const [count, setCount] = useState(0);\n  const [step, setStep] = useState(1);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Card
          title="Premium Plan"
          description="Everything you need to scale your workflow. Includes advanced analytics and priority support."
          price="$49"
          period="/month"
          features={[
            "Unlimited projects",
            "Advanced analytics",
            "Priority support 24/7",
            "Custom integrations",
            "Team collaboration",
          ]}
          highlighted={true}
          actions={
            <button className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-amber-400/25 active:scale-[0.98] tracking-wide">
              Get Started
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "ContactForm") {
      return `import ContactForm from '@/components/ContactForm';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <ContactForm />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
