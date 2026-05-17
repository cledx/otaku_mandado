# frozen_string_literal: true

# Which navbar links to show for the current user and sale schedule.
class NavVisibility
  def initialize(user)
    @user = user
  end

  def as_json
    {
      role: @user.role,
      current_sale: current_sale?,
      upcoming_sale: upcoming_sale?
    }
  end

  private

  def current_sale?
    if @user.role == "admin"
      Sale.kept.any? { |sale| Sale.admin_current_nav?(sale) }
    else
      Sale.kept.any? { |sale| Sale.client_current_nav?(sale) }
    end
  end

  def upcoming_sale?
    return false unless @user.role == "admin"

    Sale.ongoing.nil? && Sale.next_scheduled.present?
  end
end
