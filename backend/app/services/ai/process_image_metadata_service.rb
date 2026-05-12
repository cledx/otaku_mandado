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
    end

    def call
      Result.new(items: [], errors: [])
    end

    private

    attr_reader :sale, :metadata
  end
end
