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
      partyId: 'party-b8120b59-99f4-44ce-9f6b-e9b9abef8903::122077e44d8d0e23454a40a9bf0f60e18930fc69a867608f4597595487d0bc819009',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'party-a0d35513-ec39-4add-94c9-fe5c85217cd3::122077e44d8d0e23454a40a9bf0f60e18930fc69a867608f4597595487d0bc819009',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'party-bb7edc03-48f8-48c7-8b30-a5a38558ca89::122077e44d8d0e23454a40a9bf0f60e18930fc69a867608f4597595487d0bc819009',
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