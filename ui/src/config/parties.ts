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
      partyId: 'party-84c51cf6-24d3-4cd8-839e-9f13f7e7e717::12205127d4b2ed977d0fa7c28ddd4913045818f0be54b207efdfefcafca49d69cea7',
      role: 'User'
    },
    bob: {
      displayName: 'Bob',
      partyId: 'party-1440957d-5e63-4357-be8f-a1e864944cf5::12205127d4b2ed977d0fa7c28ddd4913045818f0be54b207efdfefcafca49d69cea7',
      role: 'User'
    },
    bank: {
      displayName: 'Bank',
      partyId: 'party-431becaf-adf6-4f17-a0ff-cc5c2b0bf611::12205127d4b2ed977d0fa7c28ddd4913045818f0be54b207efdfefcafca49d69cea7',
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