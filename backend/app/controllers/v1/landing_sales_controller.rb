# frozen_string_literal: true

module V1
  class LandingSalesController < ApplicationController
    def show
      sale = Sale.next_for_landing
      render json: { data: sale ? landing_payload(sale) : nil }
    end

    private

    def landing_payload(sale)
      sa = sale.starts_at
      ea = sale.ends_at
      now = Time.current
      phase =
        if sa && ea
          if now < sa
            "before"
          elsif now < ea
            "during"
          else
            "after"
          end
        end

      {
        phase: phase,
        starts_at: sa&.iso8601(3),
        ends_at: ea&.iso8601(3),
        sale: sale.to_api_hash
      }
    end
  end
end
