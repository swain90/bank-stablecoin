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
      partyId: 'party-e3f499e0-f02b-486f-b83c-83d455886423::12203dfa927bda0e3ab8335db35533d56c50c54bf0a6549c9155007a0bf036c9993a',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'party-cdc636b7-a591-4e6e-b36f-1c12ae4276ff::12203dfa927bda0e3ab8335db35533d56c50c54bf0a6549c9155007a0bf036c9993a',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'party-22eadbf8-6555-4482-a862-75c8eb9ef73d::12203dfa927bda0e3ab8335db35533d56c50c54bf0a6549c9155007a0bf036c9993a',
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