# Gnosis Split

UI demo of a bill-splitting feature imagined on top of Gnosis products (Pay, Card). Built using svelte-kit, TailwindCSS, and Typescript. 
PWA-ready for maximum mobile-compatibility.

Disclaimer: Data related to Gnosis products here are mocked (card details, transactions), not a live production data. Use the app at your own risk.

## Features
- Get your payment and create a split with friends (up to 10 people).
- Input their wallet addresses or ENS (Ethereum mainnet) to create split payments.
- Share split payments to friends using QR code or links.
- While connected to their wallet, they can open the link on the app and simply pay you back.

## Improvements
- Integrate with live APIs from Gnosis Pay and Card to get Safe account, cards, and transaction details.
- Add a backend service (not preferable) or integrate Graph indexer (preferred) for seamless payment updates.
