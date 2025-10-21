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
      partyId: 'party-b2b4b756-0374-442f-a59d-52e35027e71d::12205e95f4176f198fe441c2ec9985082024785d77d023ee817933da49f5c33fd0e9',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'party-4779ae56-20cb-4549-92f8-f9220db68a66::12205e95f4176f198fe441c2ec9985082024785d77d023ee817933da49f5c33fd0e9',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'party-da15c2c4-e9d6-47db-ae8f-ff2081ab4075::12205e95f4176f198fe441c2ec9985082024785d77d023ee817933da49f5c33fd0e9',
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