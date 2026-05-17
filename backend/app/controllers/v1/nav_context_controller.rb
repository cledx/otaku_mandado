# frozen_string_literal: true

module V1
  class NavContextController < BaseController
    def show
      render json: { data: NavVisibility.new(current_user).as_json }, status: :ok
    end
  end
end
