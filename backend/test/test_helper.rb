# Shared setup for backend model and integration tests.
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    def with_stubbed_jpy_to_mxn(convert_yen_impl)
      singleton = class << Currency::JpyToMxnConverter; self; end
      original = singleton.instance_method(:convert_yen)
      singleton.define_method(:convert_yen, convert_yen_impl)
      yield
    ensure
      singleton.define_method(:convert_yen, original)
    end
  end
end
