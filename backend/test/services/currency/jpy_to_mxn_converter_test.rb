# frozen_string_literal: true

require "test_helper"

module Currency
  class JpyToMxnConverterTest < ActiveSupport::TestCase
    test "convert_yen multiplies by rate and rounds to nearest ten pesos" do
      assert_equal 120, JpyToMxnConverter.convert_yen(1000, rate: 0.123)
      assert_equal 130, JpyToMxnConverter.convert_yen(1040, rate: 0.123)
    end

    test "convert_yen rounds half up at five pesos" do
      assert_equal 130, JpyToMxnConverter.convert_yen(1050, rate: 0.123)
    end
  end
end
