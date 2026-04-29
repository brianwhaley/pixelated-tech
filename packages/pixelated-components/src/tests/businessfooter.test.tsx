import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { BusinessFooter } from '@/components/general/businessfooter';
import type { SiteInfo } from '@/components/config/config.types';

const siteInfo: SiteInfo = {
  name: 'Manning Metalworks',
  description: 'Custom metal fabrication in Morris Plains, NJ.',
  url: 'https://www.manningmetalworks.com',
  email: 'manningmetalworks@gmail.com',
  telephone: '(973) 906-0441',
  address: {
    streetAddress: '24 West Hanover Avenue',
    addressLocality: 'Morris Plains',
    addressRegion: 'NJ',
    postalCode: '07950',
    addressCountry: 'US',
  },
  openingHours: [
    { day: 'Mon', open: '09:00', close: '17:00' },
    { day: 'Tue', open: '09:00', close: '17:00' },
    { day: 'Sat', closed: true },
    { day: 'Sun', closed: true },
  ],
};

describe('BusinessFooter', () => {
  it('renders site contact info and a Google Maps link', () => {
    render(<BusinessFooter siteInfo={siteInfo} />);

    expect(screen.getByText('Manning Metalworks')).toBeTruthy();
    expect(screen.getByText('24 West Hanover Avenue')).toBeTruthy();
    expect(screen.getByRole('link', { name: /24 West Hanover Avenue/ })).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.google.com/maps/search/?api=1&query=')
    );
    expect(screen.getByRole('link', { name: '(973) 906-0441' })).toHaveAttribute('href', 'tel:(973) 906-0441');
    expect(screen.getByRole('link', { name: 'manningmetalworks@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:manningmetalworks@gmail.com'
    );
  });

  it('renders opening hours in traditional AM/PM format and an embed iframe', () => {
    render(<BusinessFooter siteInfo={siteInfo} />);

    expect(screen.getByText('Mon: 9:00 AM - 5:00 PM')).toBeTruthy();
    expect(screen.getByText('Sat: Closed')).toBeTruthy();
    const frame = screen.getByTitle('Business location map');
    expect(frame).toHaveAttribute('src', expect.stringContaining('https://www.google.com/maps?q='));
  });
});
