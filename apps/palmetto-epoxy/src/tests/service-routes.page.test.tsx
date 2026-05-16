import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ServiceAreasPage from '@/app/(pages)/service-areas/page';
import BeaufortServiceAreaPage from '@/app/(pages)/service-areas/beaufort-sc/page';
import BlufftonServiceAreaPage from '@/app/(pages)/service-areas/bluffton-sc/page';
import HardeevilleServiceAreaPage from '@/app/(pages)/service-areas/hardeeville-sc/page';
import HiltonHeadServiceAreaPage from '@/app/(pages)/service-areas/hilton-head-sc/page';
import OkatieServiceAreaPage from '@/app/(pages)/service-areas/okatie-sc/page';
import RidgelandServiceAreaPage from '@/app/(pages)/service-areas/ridgeland-sc/page';
import CommercialServicePage from '@/app/(pages)/services/commercial/page';
import ConcretePolishingServicePage from '@/app/(pages)/services/concrete-polishing/page';
import DrivewayCoatingServicePage from '@/app/(pages)/services/driveway-coating/page';
import EpoxyGarageFloorsServicePage from '@/app/(pages)/services/epoxy-garage-floors/page';
import PaverSealingServicePage from '@/app/(pages)/services/paver-sealing/page';
import ResidentialServicePage from '@/app/(pages)/services/residential/page';
import ResinCountertopsServicePage from '@/app/(pages)/services/resin-countertops/page';

describe('Palmetto Epoxy service route pages', () => {
	it('renders each service and service-area route page', () => {
		const pages: Array<{ name: string; Component: () => JSX.Element }> = [
			{ name: 'service areas index', Component: ServiceAreasPage },
			{ name: 'beaufort service area', Component: BeaufortServiceAreaPage },
			{ name: 'bluffton service area', Component: BlufftonServiceAreaPage },
			{ name: 'hardeeville service area', Component: HardeevilleServiceAreaPage },
			{ name: 'hilton head service area', Component: HiltonHeadServiceAreaPage },
			{ name: 'okatie service area', Component: OkatieServiceAreaPage },
			{ name: 'ridgeland service area', Component: RidgelandServiceAreaPage },
			{ name: 'commercial service', Component: CommercialServicePage },
			{ name: 'concrete polishing service', Component: ConcretePolishingServicePage },
			{ name: 'driveway coating service', Component: DrivewayCoatingServicePage },
			{ name: 'epoxy garage floors service', Component: EpoxyGarageFloorsServicePage },
			{ name: 'paver sealing service', Component: PaverSealingServicePage },
			{ name: 'residential service', Component: ResidentialServicePage },
			{ name: 'resin countertops service', Component: ResinCountertopsServicePage },
		];

		for (const page of pages) {
			const RoutePage = page.Component;
			const { unmount } = render(<RoutePage />);
			expect(screen.getAllByTestId('mock-pagesection').length, page.name).toBeGreaterThan(0);
			unmount();
		}
	});
});
