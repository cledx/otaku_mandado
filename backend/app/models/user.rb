# frozen_string_literal: true

class User < ApplicationRecord
  ROLES = %w[admin client].freeze

  attribute :role, :string, default: "client"

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :role, inclusion: { in: ROLES }

  has_many :orders, dependent: :destroy
end
