# frozen_string_literal: true

module Ai
  class ProcessImageMetadataService
    Result = Struct.new(:items, :errors, keyword_init: true) do
      def success?
        errors.blank?
      end
    end

    def initialize(sale:, metadata:)
      @sale = sale
      @metadata = metadata
      @chat = RubyLLM.chat
    end

    def call
      response = @chat.ask("What is this image of?", with: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSttlpYi2lbKS-SDuGOmfyaPEAlTp_oYZAUmg&s")
      puts response.content
      # Result.new(items: [], errors: [])
    end

    private

    attr_reader :sale, :metadata
  end
end
