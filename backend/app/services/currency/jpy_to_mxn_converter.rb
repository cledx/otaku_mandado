# frozen_string_literal: true

require "json"
require "net/http"

module Currency
  # Converts a JPY amount to MXN using the latest JPY→MXN rate (Frankfurter API).
  class JpyToMxnConverter
    class RateUnavailable < StandardError; end

    FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?from=JPY&to=MXN"
    CACHE_KEY = "currency/jpy_mxn_rate"
    CACHE_TTL = 1.hour

    def self.convert_yen(amount, rate: nil)
      new(rate: rate).convert_yen(amount)
    end

    def initialize(rate: nil)
      @rate_override = rate
    end

    def convert_yen(amount)
      yen = amount.to_f
      pesos = yen * jpy_to_mxn_rate
      round_to_nearest_ten(pesos)
    end

    private

    attr_reader :rate_override

    def jpy_to_mxn_rate
      rate_override || fetch_cached_rate
    end

    def fetch_cached_rate
      Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) { fetch_rate }
    end

    def fetch_rate
      uri = URI(FRANKFURTER_URL)
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 5, read_timeout: 5) do |http|
        http.get(uri.request_uri)
      end

      unless response.is_a?(Net::HTTPSuccess)
        raise RateUnavailable, "exchange rate request failed (HTTP #{response.code})"
      end

      rate = JSON.parse(response.body).dig("rates", "MXN")
      raise RateUnavailable, "JPY to MXN rate missing from response" if rate.blank?

      rate.to_f
    rescue JSON::ParserError => e
      raise RateUnavailable, "invalid exchange rate response: #{e.message}"
    rescue SocketError, Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED => e
      raise RateUnavailable, "exchange rate service unreachable: #{e.message}"
    end

    def round_to_nearest_ten(value)
      (value / 10.0).round * 10
    end
  end
end
