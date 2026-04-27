import { useState, useEffect } from 'react';
import { Horizon } from '@stellar/stellar-sdk';
import { HORIZON_URL, VAULT_TOKEN_DETAILS } from '../constants';

const server = new Horizon.Server(HORIZON_URL);

export const useBalance = (address: string | null) => {
  const [xlmBalance, setXlmBalance] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const account = await server.loadAccount(address);
      
      const xlm = account.balances.find((b: any) => b.asset_type === 'native');
      setXlmBalance(xlm ? xlm.balance : "0");

      const vault = account.balances.find((b: any) => 
        b.asset_code === VAULT_TOKEN_DETAILS.CODE && 
        b.asset_issuer === VAULT_TOKEN_DETAILS.ISSUER
      );
      setVaultBalance(vault ? vault.balance : "0");
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [address]);

  return { xlmBalance, vaultBalance, loading, refresh: fetchBalances };
};
