# frozen_string_literal: true

# Which navbar links to show for the current user and sale schedule.
class NavVisibility
  def initialize(user)
    @user = user
  end

  # Booleans gate navbar link visibility; IDs let the SPA open #current-sale / #upcoming-sale.
  def as_json
    current = current_sale_record
    upcoming = upcoming_sale_record
    {
      role: @user.role,
      current_sale: current.present?,
      current_sale_id: current&.id,
      upcoming_sale: upcoming.present?,
      upcoming_sale_id: upcoming&.id
    }
  end

  private

  # Admin vs client use different time windows (see Sale.admin_current_nav? / client_current_nav?).
  def current_sale_record
    Sale.current_for_nav(@user.role)
  end

  # Admin-only: next scheduled sale when nothing is actively running.
  def upcoming_sale_record
    return nil unless @user.role == "admin"
    return nil unless Sale.ongoing.nil?

    Sale.next_scheduled
  end

  def current_sale?
    current_sale_record.present?
  end

  def upcoming_sale?
    upcoming_sale_record.present?
  end
end
