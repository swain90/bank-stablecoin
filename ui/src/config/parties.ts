// Party configuration
// Update these party IDs after each sandbox restart
// Get current IDs with: daml ledger list-parties --host localhost --port 6865

export interface PartyInfo {
    displayName: string;
    partyId: string;
    role: string;
  }
  
  export const parties: Record<string, PartyInfo> = {
    alice: {
      displayName: 'Alice',
      partyId: 'party-025fc4d9-f26a-40e1-983d-fc1d9c7b2cd3::122048a44b3c9eab33924c1944a47e4f9cdab7ac34196ee2ae08450a8787865f486c',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'party-3ef36416-c393-4399-9b32-e1b68b4d1575::122048a44b3c9eab33924c1944a47e4f9cdab7ac34196ee2ae08450a8787865f486c',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'party-655fea64-679f-4205-90d9-672158046500::122048a44b3c9eab33924c1944a47e4f9cdab7ac34196ee2ae08450a8787865f486c',
      role: 'Issuer'
    }
  };
  
  // Helper function to get party by display name
  export const getPartyByName = (name: string): PartyInfo | undefined => {
    const key = name.toLowerCase();
    return parties[key];
  };
  
  // Helper function to get display name from party ID
  export const getDisplayName = (partyId: string): string => {
    const party = Object.values(parties).find(p => p.partyId === partyId);
    
    return party?.displayName || partyId.split('::')[0];
  };
  
  // Get all parties as an array
  export const getAllParties = (): PartyInfo[] => {
    return Object.values(parties);
  };