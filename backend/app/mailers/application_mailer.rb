# frozen_string_literal: true

# Base mailer; not used by the API yet but kept for future notifications.
class ApplicationMailer < ActionMailer::Base
  default from: "from@example.com"
  layout "mailer"
end
