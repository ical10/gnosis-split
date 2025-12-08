import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { appKit } from '$lib/appkit';

export const appKitStore = writable({
  open: false,
  selectedNetworkId: undefined as string | undefined,
  address: undefined as string | undefined,
  isConnected: false
});

if (browser && appKit) {
  const account = appKit.getAccount?.();
  const state = appKit.getState?.();

  appKitStore.set({
    open: state?.open ?? false,
    selectedNetworkId: state?.selectedNetworkId,
    address: account?.address,
    isConnected: account?.isConnected ?? false
  });

  appKit.subscribeState((state) => {
    appKitStore.update((current) => ({
      ...current,
      open: state.open,
      selectedNetworkId: state.selectedNetworkId
    }));
  });

  appKit.subscribeAccount((account) => {
    appKitStore.update((current) => ({
      ...current,
      address: account.address,
      isConnected: account.isConnected
    }));
  });
}

export const isConnected = derived(appKitStore, ($state) => $state.isConnected);
export const address = derived(appKitStore, ($state) => $state.address);
export const selectedNetworkId = derived(appKitStore, ($state) => $state.selectedNetworkId);
