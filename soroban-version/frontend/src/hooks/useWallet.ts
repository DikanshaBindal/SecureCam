import { useState } from 'react';
import { getAddress, isConnected } from '@stellar/freighter-api';

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      if (await isConnected()) {
        const { address: addr } = await getAddress();
        if (addr) {
          setAddress(addr);
        } else {
          setError("User declined connection");
        }
      } else {
        setError("Freighter not found. Please install the extension.");
      }
    } catch (err) {
      setError("Failed to connect wallet.");
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  return { address, connecting, error, connect, disconnect };
};
