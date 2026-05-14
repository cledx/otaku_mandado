# frozen_string_literal: true

RubyLLM.configure do |config|
  config.anthropic_api_key = ENV["ANTHROPIC_API_KEY"]
  # Haiku 4.5 (Anthropic); alias resolves to the current dated API id (see ruby_llm models.json / aliases.json).
  config.default_model = "claude-haiku-4-5"
end
