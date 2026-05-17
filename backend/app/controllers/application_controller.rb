# frozen_string_literal: true

# Root API controller. Devise helpers are included for JWT-authenticated v1 routes.
class ApplicationController < ActionController::API
  include Devise::Controllers::Helpers
end
