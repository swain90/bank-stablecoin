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
      partyId: 'Alice::1220ef3325997febc5eeac1cf54f1294b673b4e1b715ed47231638bc1b0b25b4f2e6',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'Bob::1220ef3325997febc5eeac1cf54f1294b673b4e1b715ed47231638bc1b0b25b4f2e6',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'Bank::1220ef3325997febc5eeac1cf54f1294b673b4e1b715ed47231638bc1b0b25b4f2e6',
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