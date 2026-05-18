# frozen_string_literal: true

# Loads current_user when a valid Bearer token is present; does not fail when absent.
module OptionalAuthentication
  extend ActiveSupport::Concern

  private

  def current_user_optional
    @current_user_optional ||= warden.authenticate(scope: :user)
  end
end
