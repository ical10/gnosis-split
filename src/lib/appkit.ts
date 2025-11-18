import { browser } from '$app/environment';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { gnosisChiado, gnosis } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

let appKit: ReturnType<typeof createAppKit> | undefined = undefined;
let wagmiAdapter: WagmiAdapter | undefined = undefined;

if (browser) {
	const projectId = import.meta.env.VITE_PROJECT_ID;
	if (!projectId) {
		throw new Error('VITE_PROJECT_ID is not set');
	}

	const networks = [gnosisChiado, gnosis] as [AppKitNetwork, ...AppKitNetwork[]];

	wagmiAdapter = new WagmiAdapter({
		networks,
		projectId
	});

	appKit = createAppKit({
		adapters: [wagmiAdapter],
		networks: [gnosisChiado, gnosis],
		defaultNetwork: gnosisChiado,
		projectId,
		metadata: {
			name: 'Gnosis Split',
			description: 'Split expenses with Gnosis Pay and get reimbursed on-chain',
			url: 'https://reown.com/appkit',
			icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
		}
	});
}

export { appKit };
export const config = wagmiAdapter?.wagmiConfig;
