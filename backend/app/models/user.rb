# frozen_string_literal: true

# Authenticated account (Devise + JWT). Role defaults to client; admin is assigned out of band.
class User < ApplicationRecord
  ROLES = %w[admin client].freeze

  # In-memory default; DB column also defaults to "client" (see AddRoleToUsers migration).
  attribute :role, :string, default: "client"

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :role, inclusion: { in: ROLES }

  has_many :orders, dependent: :destroy
end
