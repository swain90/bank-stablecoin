import React, { useState, useEffect } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { 
  Container, Grid, Header, Segment, Card, Button, Icon, 
  Form, Modal, Statistic, Label, List, Loader, Dropdown,
  Table, Message
} from 'semantic-ui-react';
import { FiatBankAccount, SavingsAccount, AccountOpeningRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/RealBankAccount';
import { StablecoinHolding, BankReserve, IssuanceRequest, RedemptionRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { showSuccess, showError, showWarning } from './Toast';
import { getDisplayName, getAllParties } from '../config/parties';
import WalletConnect from './WalletConnect';
import TokenSwap from './TokenSwap';

// const RealBankingDashboard: React.FC = () => {
//   const party = useParty();
//   const ledger = useLedger();
  
//   const { contracts: fiatAccounts, loading: accountsLoading } = useStreamQueries(FiatBankAccount);
//   const { contracts: savingsAccounts, loading: savingsLoading } = useStreamQueries(SavingsAccount);
//   const { contracts: accountRequests, loading: requestsLoading } = useStreamQueries(AccountOpeningRequest);
//   const { contracts: stablecoins } = useStreamQueries(StablecoinHolding);
//   const { contracts: reserves } = useStreamQueries(BankReserve);
  
//   const [createAccountModal, setCreateAccountModal] = useState(false);
//   const [depositModal, setDepositModal] = useState(false);
//   const [withdrawModal, setWithdrawModal] = useState(false);
//   const [convertModal, setConvertModal] = useState(false);
  
//   const [accountType, setAccountType] = useState('CHECKING');
//   const [selectedAccount, setSelectedAccount] = useState<any>(null);
//   const [depositAmount, setDepositAmount] = useState('');
//   const [withdrawAmount, setWithdrawAmount] = useState('');
//   const [convertAmount, setConvertAmount] = useState('');
//   const [convertDirection, setConvertDirection] = useState<'fiat-to-stable' | 'stable-to-fiat'>('fiat-to-stable');
  
//   const [unitCustomerId, setUnitCustomerId] = useState<string | null>(null);
//   const [isCreatingAccount, setIsCreatingAccount] = useState(false);

//   useEffect(() => {
//     const initUnit = async () => {
//       try {
//         console.log('Initializing Unit customer for party:', party);
        
//         // IMPORTANT: Use the correct URL with /api/unit prefix
//         const response = await fetch('http://localhost:3002/api/unit/get-or-create-customer', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             partyId: party,
//             email: `${party.replace(/[^a-zA-Z0-9]/g, '')}@example.com`,
//             fullName: {
//               first: 'User',
//               last: party.substring(0, 8)
//             }
//           })
//         });
    
//         console.log('Response status:', response.status);
        
//         if (!response.ok) {
//           const errorData = await response.json();
//           console.error('Error response:', errorData);
//           throw new Error(errorData.error || 'Failed to initialize Unit customer');
//         }
    
//         const data = await response.json();
//         console.log('✓ Unit account created:', data);
        
//         if (data.success) {
//           setUnitCustomerId(data.customerId);
//           showSuccess('Banking API connected successfully!');
//         } else {
//           throw new Error(data.error || 'Unknown error');
//         }
//       } catch (error: any) {
//         console.error('Failed to initialize Unit customer:', error);
//         showError(`Banking API initialization failed: ${error.message}`);
//         // Don't fail silently - but don't crash either
//       }
//     };
    
//     if (party) {
//       initUnit();
//     }
//   }, [party]);

//   const totalFiatBalance = fiatAccounts.reduce(
//     (sum, acc) => sum + parseFloat(acc.payload.balance), 
//     0
//   );
  
//   const totalStablecoinBalance = stablecoins.reduce(
//     (sum, sc) => sum + parseFloat(sc.payload.amount), 
//     0
//   );

//   const handleCreateAccount = async () => {
//     if (!unitCustomerId) {
//       showError('Unit customer not initialized. Please refresh the page.');
//       return;
//     }
  
//     setIsCreatingAccount(true);
    
//     try {
//       console.log('Creating account with Unit...');
//       console.log('Customer ID:', unitCustomerId);
//       console.log('Account Type:', accountType);
      
//       // IMPORTANT: Use the correct URL with /api/unit prefix
//       const response = await fetch('http://localhost:3002/api/unit/create-account', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           customerId: unitCustomerId,
//           type: accountType
//         })
//       });
      
//       console.log('Create account response status:', response.status);
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Create account error:', errorData);
//         throw new Error(errorData.error || 'Failed to create account');
//       }
      
//       const accountData = await response.json();
//       console.log('Account created:', accountData);
      
//       showSuccess(`${accountType} account created successfully! Account: ${accountData.attributes.accountNumber}`);
//       setCreateAccountModal(false);
      
//     } catch (error: any) {
//       console.error('Account creation failed:', error);
//       showError(`Failed to create account: ${error.message}`);
//     } finally {
//       setIsCreatingAccount(false);
//     }
//   };

//   const handleDeposit = async () => {
//     if (!selectedAccount || !depositAmount) return;
    
//     const amount = parseFloat(depositAmount);
//     if (isNaN(amount) || amount <= 0) {
//       showError('Invalid deposit amount');
//       return;
//     }

//     try {
//       await ledger.exercise(
//         FiatBankAccount.DepositFiat,
//         selectedAccount.contractId,
//         {
//           amount: amount.toString(),
//           source: 'External Bank Transfer',
//           transactionId: `TXN-${Date.now()}`
//         }
//       );
      
//       showSuccess(`Deposited $${amount.toFixed(2)} successfully!`);
//       setDepositModal(false);
//       setDepositAmount('');
      
//     } catch (error: any) {
//       showError(`Deposit failed: ${error.message}`);
//     }
//   };

//   const handleWithdraw = async () => {
//     if (!selectedAccount || !withdrawAmount) return;
    
//     const amount = parseFloat(withdrawAmount);
//     if (isNaN(amount) || amount <= 0) {
//       showError('Invalid withdrawal amount');
//       return;
//     }
    
//     if (amount > parseFloat(selectedAccount.payload.balance)) {
//       showError('Insufficient balance');
//       return;
//     }

//     try {
//       await ledger.exercise(
//         FiatBankAccount.WithdrawFiat,
//         selectedAccount.contractId,
//         {
//           amount: amount.toString(),
//           destination: 'External Bank Account',
//           transactionId: `TXN-${Date.now()}`
//         }
//       );
      
//       showSuccess(`Withdrew $${amount.toFixed(2)} successfully!`);
//       setWithdrawModal(false);
//       setWithdrawAmount('');
      
//     } catch (error: any) {
//       showError(`Withdrawal failed: ${error.message}`);
//     }
//   };

//   const handleConvert = async () => {
//     if (!selectedAccount || !convertAmount) return;
    
//     const amount = parseFloat(convertAmount);
//     if (isNaN(amount) || amount <= 0) {
//       showError('Invalid conversion amount');
//       return;
//     }
    
//     if (!reserves || reserves.length === 0) {
//       showError('No reserve contract found');
//       return;
//     }

//     try {
//       if (convertDirection === 'fiat-to-stable') {
//         if (amount > parseFloat(selectedAccount.payload.balance)) {
//           showError('Insufficient fiat balance');
//           return;
//         }
        
//         await ledger.exercise(
//           FiatBankAccount.MintStablecoin,
//           selectedAccount.contractId,
//           {
//             amount: amount.toString(),
//             reserveCid: reserves[0].contractId
//           }
//         );
        
//         showSuccess(`Converted $${amount.toFixed(2)} fiat to stablecoin!`);
        
//       } else {
//         const availableStablecoin = stablecoins.find(
//           sc => parseFloat(sc.payload.amount) >= amount && sc.payload.currency === 'USD'
//         );
        
//         if (!availableStablecoin) {
//           showError('Insufficient stablecoin balance');
//           return;
//         }
        
//         await ledger.exercise(
//           FiatBankAccount.BurnStablecoin,
//           selectedAccount.contractId,
//           {
//             stablecoinCid: availableStablecoin.contractId,
//             reserveCid: reserves[0].contractId
//           }
//         );
        
//         showSuccess(`Converted ${amount.toFixed(2)} stablecoin to fiat!`);
//       }
      
//       setConvertModal(false);
//       setConvertAmount('');
      
//     } catch (error: any) {
//       showError(`Conversion failed: ${error.message}`);
//     }
//   };

//   if (accountsLoading || savingsLoading) {
//     return (
//       <Container style={{ marginTop: '2em', textAlign: 'center' }}>
//         <Loader active size="large">Loading bank accounts...</Loader>
//       </Container>
//     );
//   }

//   return (
//     <Container style={{ marginTop: '2em' }}>
//       <Header as="h1" color="green">
//         <Icon name="university" />
//         Real Banking Dashboard
//         <Header.Subheader>FDIC-Insured Bank Accounts + Unit.co Integration</Header.Subheader>
//       </Header>

//       {/* Connection Status */}
//       <Message 
//         info={!!unitCustomerId} 
//         warning={!unitCustomerId}
//         icon
//       >
//         <Icon name={unitCustomerId ? 'check circle' : 'warning sign'} />
//         <Message.Content>
//           <Message.Header>
//             {unitCustomerId ? 'Banking API Connected' : 'Connecting to Banking API...'}
//           </Message.Header>
//           {unitCustomerId ? (
//             <p>Customer ID: {unitCustomerId}</p>
//           ) : (
//             <p>Initializing Unit.co connection...</p>
//           )}
//         </Message.Content>
//       </Message>

//       {/* Balance Overview */}
//       <Segment>
//         <Statistic.Group widths="three">
//           <Statistic color="green">
//             <Statistic.Value>
//               ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </Statistic.Value>
//             <Statistic.Label>Total Fiat Balance</Statistic.Label>
//           </Statistic>
          
//           <Statistic color="blue">
//             <Statistic.Value>
//               {totalStablecoinBalance.toFixed(2)}
//             </Statistic.Value>
//             <Statistic.Label>Stablecoin Balance</Statistic.Label>
//           </Statistic>
          
//           <Statistic>
//             <Statistic.Value>{fiatAccounts.length}</Statistic.Value>
//             <Statistic.Label>Bank Accounts</Statistic.Label>
//           </Statistic>
//         </Statistic.Group>
//       </Segment>

//       {/* Quick Actions */}
//       <Segment>
//         <Button.Group fluid size="large">
//           <Button 
//             primary 
//             onClick={() => setCreateAccountModal(true)}
//             disabled={!unitCustomerId}
//           >
//             <Icon name="plus circle" />
//             Open New Account
//           </Button>
//           <Button color="green" disabled={fiatAccounts.length === 0}>
//             <Icon name="exchange" />
//             Transfer Between Accounts
//           </Button>
//         </Button.Group>
//       </Segment>

//       {/* Pending Requests */}
//       {accountRequests.length > 0 && (
//         <Message info>
//           <Message.Header>Pending Account Requests</Message.Header>
//           <p>You have {accountRequests.length} account opening request(s) pending bank approval.</p>
//         </Message>
//       )}

//       {/* Bank Accounts */}
//       <Header as="h2" style={{ marginTop: '2em' }}>
//         <Icon name="credit card outline" />
//         Your Bank Accounts
//       </Header>

//       {fiatAccounts.length === 0 ? (
//         <Segment placeholder>
//           <Header icon>
//             <Icon name="university" />
//             No bank accounts yet
//           </Header>
//           <Button 
//             primary 
//             onClick={() => setCreateAccountModal(true)}
//             disabled={!unitCustomerId}
//           >
//             Open Your First Account
//           </Button>
//         </Segment>
//       ) : (
//         <Card.Group>
//           {fiatAccounts.map(account => {
//             const isChecking = account.payload.accountType === 'CHECKING';
//             const isFrozen = account.payload.status === 'FROZEN';
            
//             return (
//               <Card key={account.contractId} fluid color={isChecking ? 'blue' : 'green'}>
//                 <Card.Content>
//                   <Card.Header>
//                     <Icon name={isChecking ? 'credit card' : 'money bill alternate outline'} />
//                     {account.payload.accountType} Account
//                     {account.payload.fdicInsured && (
//                       <Label color="green" size="tiny" style={{ marginLeft: '1em' }}>
//                         FDIC Insured
//                       </Label>
//                     )}
//                     {isFrozen && (
//                       <Label color="red" size="tiny" style={{ marginLeft: '0.5em' }}>
//                         FROZEN
//                       </Label>
//                     )}
//                   </Card.Header>
                  
//                   <Card.Meta style={{ marginTop: '0.5em' }}>
//                     <div>Account: ••••{account.payload.accountNumber.slice(-4)}</div>
//                     <div>Routing: {account.payload.routingNumber}</div>
//                     <div>Provider: {account.payload.provider}</div>
//                   </Card.Meta>
                  
//                   <Card.Description style={{ marginTop: '1em' }}>
//                     <Statistic size="small">
//                       <Statistic.Value>
//                         ${parseFloat(account.payload.balance).toLocaleString('en-US', { 
//                           minimumFractionDigits: 2, 
//                           maximumFractionDigits: 2 
//                         })}
//                       </Statistic.Value>
//                       <Statistic.Label>Available Balance</Statistic.Label>
//                     </Statistic>
//                   </Card.Description>
//                 </Card.Content>
                
//                 <Card.Content extra>
//                   <Button.Group fluid>
//                     <Button 
//                       color="blue" 
//                       disabled={isFrozen}
//                       onClick={() => {
//                         setSelectedAccount(account);
//                         setDepositModal(true);
//                       }}
//                     >
//                       <Icon name="arrow up" />
//                       Deposit
//                     </Button>
//                     <Button 
//                       color="orange"
//                       disabled={isFrozen}
//                       onClick={() => {
//                         setSelectedAccount(account);
//                         setWithdrawModal(true);
//                       }}
//                     >
//                       <Icon name="arrow down" />
//                       Withdraw
//                     </Button>
//                     <Button 
//                       color="purple"
//                       disabled={isFrozen}
//                       onClick={() => {
//                         setSelectedAccount(account);
//                         setConvertModal(true);
//                       }}
//                     >
//                       <Icon name="exchange" />
//                       Convert
//                     </Button>
//                   </Button.Group>
//                 </Card.Content>
//               </Card>
//             );
//           })}
//         </Card.Group>
//       )}

//       {/* Create Account Modal */}
//       <Modal open={createAccountModal} onClose={() => setCreateAccountModal(false)} size="small">
//         <Modal.Header>
//           <Icon name="university" />
//           Open New Bank Account
//         </Modal.Header>
//         <Modal.Content>
//           <Form>
//             <Form.Field>
//               <label>Account Type</label>
//               <Dropdown
//                 selection
//                 fluid
//                 options={[
//                   { 
//                     key: 'checking', 
//                     text: '💳 Checking Account', 
//                     value: 'CHECKING',
//                     description: 'For everyday transactions'
//                   },
//                   { 
//                     key: 'savings', 
//                     text: '🐷 Savings Account', 
//                     value: 'SAVINGS',
//                     description: 'Earn 4.5% APY interest'
//                   }
//                 ]}
//                 value={accountType}
//                 onChange={(e, { value }) => setAccountType(value as string)}
//               />
//             </Form.Field>
            
//             <Segment color="green">
//               <Header as="h4">Account Benefits</Header>
//               <List>
//                 <List.Item>
//                   <Icon name="check" color="green" />
//                   <List.Content>FDIC Insured up to $250,000</List.Content>
//                 </List.Item>
//                 <List.Item>
//                   <Icon name="check" color="green" />
//                   <List.Content>Free ACH transfers</List.Content>
//                 </List.Item>
//                 <List.Item>
//                   <Icon name="check" color="green" />
//                   <List.Content>Instant conversion to stablecoins</List.Content>
//                 </List.Item>
//                 <List.Item>
//                   <Icon name="check" color="green" />
//                   <List.Content>No monthly maintenance fees</List.Content>
//                 </List.Item>
//                 {accountType === 'SAVINGS' && (
//                   <List.Item>
//                     <Icon name="star" color="yellow" />
//                     <List.Content><strong>Earn 4.5% APY interest</strong></List.Content>
//                   </List.Item>
//                 )}
//               </List>
//             </Segment>
            
//             <Message info>
//               <Message.Header>Demo Mode</Message.Header>
//               <p>This will create a real sandbox account with Unit.co for testing purposes.</p>
//             </Message>
//           </Form>
//         </Modal.Content>
//         <Modal.Actions>
//           <Button onClick={() => setCreateAccountModal(false)}>Cancel</Button>
//           <Button 
//             primary 
//             loading={isCreatingAccount}
//             disabled={!unitCustomerId || isCreatingAccount}
//             onClick={handleCreateAccount}
//           >
//             <Icon name="university" />
//             Open {accountType} Account
//           </Button>
//         </Modal.Actions>
//       </Modal>

//       {/* Deposit, Withdraw, Convert Modals - keeping them the same */}
//       {/* ... rest of your modals ... */}
      
//     </Container>
//   );
// };

const RealBankingDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  
  const { contracts: fiatAccounts, loading: accountsLoading } = useStreamQueries(FiatBankAccount);
  const { contracts: savingsAccounts, loading: savingsLoading } = useStreamQueries(SavingsAccount);
  const { contracts: stablecoins } = useStreamQueries(StablecoinHolding);
  const { contracts: issuanceRequests } = useStreamQueries(IssuanceRequest);
  const { contracts: redemptionRequests } = useStreamQueries(RedemptionRequest);

// Track previous counts to detect changes
const [prevStablecoinCount, setPrevStablecoinCount] = useState(0);
const [prevRedemptionCount, setPrevRedemptionCount] = useState(0);
  
  const [unitCustomerId, setUnitCustomerId] = useState<string | null>(null);
  const [unitAccountId, setUnitAccountId] = useState<string | null>(null);
  const [unitBalance, setUnitBalance] = useState<number>(0);
  const [unitAccountNumber, setUnitAccountNumber] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // ← Add this
  
  const [createAccountModal, setCreateAccountModal] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  
  const [accountType, setAccountType] = useState('CHECKING');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertDirection, setConvertDirection] = useState<'fiat-to-stable' | 'stable-to-fiat'>('fiat-to-stable');
  
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Initialize Unit customer on mount
  useEffect(() => {
    const initUnit = async () => {
      try {
        console.log('Initializing Unit customer for party:', party);
        
        const response = await fetch('http://localhost:3002/api/unit/get-or-create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyId: party,
            email: `${party.replace(/[^a-zA-Z0-9]/g, '')}@example.com`,
            fullName: {
              first: 'User',
              last: party.substring(0, 8)
            }
          })
        });
    
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to initialize Unit customer');
        }
    
        const data = await response.json();
        console.log('✓ Unit account created:', data);
        
        if (data.success) {
          setUnitCustomerId(data.customerId);
          setUnitAccountId(data.accountId);
          setUnitBalance(data.balance || 0);
          setUnitAccountNumber(data.accountNumber || '');
          showSuccess(`Banking API connected! Account ${data.accountNumber} created with $${(data.balance / 100).toFixed(2)}`);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error: any) {
        console.error('Failed to initialize Unit customer:', error);
        showWarning(`Using mock banking data: ${error.message}`);
      }
    };
    
    if (party) {
      initUnit();
    }
  }, [party]);

  useEffect(() => {
    // When a redemption is approved, the redemption request is consumed
    if (prevRedemptionCount > redemptionRequests.length) {
      const myRedemptions = redemptionRequests.filter(r => r.payload.redeemer === party);
      
      showSuccess('Redemption approved! Stablecoin burned.');
      // In production, this would trigger a Unit API call to credit the account
    }
    
    setPrevRedemptionCount(redemptionRequests.length);
  }, [redemptionRequests, party, prevRedemptionCount]);

  // Monitor stablecoin changes
  useEffect(() => {
    const currentCount = stablecoins.length;
    
    if (prevStablecoinCount > 0 && currentCount > prevStablecoinCount) {
      // New stablecoin received (issuance approved)
      showSuccess('Stablecoin issuance approved!');
    } else if (prevStablecoinCount > currentCount) {
      // Stablecoin was burned (redemption approved)
      console.log('Stablecoin redeemed');
    }
    
    setPrevStablecoinCount(currentCount);
  }, [stablecoins, prevStablecoinCount]);

  const handleCreateAccount = async () => {
    if (!unitCustomerId) {
      showError('Unit customer not initialized. Please refresh the page.');
      return;
    }
  
    setIsCreatingAccount(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/unit/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: unitCustomerId,
          type: accountType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      
      const accountData = await response.json();
      
      showSuccess(`${accountType} account created! Account: ${accountData.attributes.accountNumber}`);
      setCreateAccountModal(false);
      
    } catch (error: any) {
      showError(`Failed to create account: ${error.message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };
  // Add these handler functions before the return statement

  const handleDeposit = async () => {
    if (!depositAmount) return;
    
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
      }
  
      // Update Unit account balance (mock)
      // In production, this would be a real API call to Unit
      setUnitBalance(prev => prev + (amount * 100)); // Convert to cents
  
      showSuccess(`Deposited $${amount.toFixed(2)} to your Unit account`);
      setDepositModal(false);
      setDepositAmount('');
    } catch (error) {
      showError('Failed to deposit funds', error);
    }
  };
  
  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    
    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
      }
  
      if (amount * 100 > unitBalance) {
        showError('Insufficient funds');
        return;
      }
  
      // Update Unit account balance (mock)
      setUnitBalance(prev => prev - (amount * 100));
  
      showSuccess(`Withdrew $${amount.toFixed(2)} from your Unit account`);
      setWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error) {
      showError('Failed to withdraw funds', error);
    }
  };
  
  const handleConvert = async () => {
    if (!convertAmount) return;
    
    try {
      const amount = parseFloat(convertAmount);
      if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return;
      }
  
      if (convertDirection === 'fiat-to-stable') {
        // Check if user has enough Unit balance
        if (amount * 100 > unitBalance) {
          showError('Insufficient Unit account balance');
          return;
        }
  
        // Convert fiat to stablecoin - create issuance request
        const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId;
        if (!bankParty) {
          showError('Bank not found');
          return;
        }
  
        await ledger.create(IssuanceRequest, {
          bank: bankParty,
          requester: party,
          amount: convertAmount,
          currency: selectedCurrency || 'USD', // use a state variable if you have one
          reason: 'User requested fiat to stablecoin conversion'
        });
  
        // Deduct from Unit balance
        setUnitBalance(prev => prev - (amount * 100));
  
        showSuccess(`Requested issuance of $${amount.toFixed(2)} stablecoin. Awaiting bank approval.`);
      } else {
        // Convert stablecoin to fiat - create redemption request
        const totalStablecoin = stablecoins.reduce((sum, s) => sum + parseFloat(s.payload.amount), 0);
        
        if (amount > totalStablecoin) {
          showError('Insufficient stablecoin balance');
          return;
        }
  
        // Find a stablecoin holding with enough balance
        const stablecoinToRedeem = stablecoins.find(s => 
          parseFloat(s.payload.amount) >= amount
        );
  
        if (!stablecoinToRedeem) {
          showError('No single stablecoin holding is large enough. Try a smaller amount.');
          return;
        }
  
        const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId;
        if (!bankParty) {
          showError('Bank not found');
          return;
        }
  
        // Create redemption request
        await ledger.create(RedemptionRequest, {
          bank: bankParty,
          redeemer: party,
          holding: {
            owner: stablecoinToRedeem.payload.owner,
            issuer: stablecoinToRedeem.payload.issuer,
            amount: convertAmount,
            currency: stablecoinToRedeem.payload.currency,
            frozen: false
          }
        });
  
        showSuccess(`Requested redemption of $${amount.toFixed(2)} stablecoin. Awaiting bank approval.`);
      }
  
      setConvertModal(false);
      setConvertAmount('');
    } catch (error) {
      showError('Failed to convert', error);
    }
  };
  
  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as='h1' textAlign='center'>
        <Icon name='university' />
        Fiat Banking Dashboard
      </Header>

      {/* Unit Account Info Card */}
      <Segment>
        <Header as='h2'>
          <Icon name='credit card' />
          Your Unit Banking Account
        </Header>
        
        {unitCustomerId ? (
          <Card.Group>
            <Card fluid color='blue'>
              <Card.Content>
                <Card.Header>Checking Account</Card.Header>
                <Card.Meta>Account: {unitAccountNumber}</Card.Meta>
                <Card.Description>
                  <Statistic size='small'>
                    <Statistic.Label>Balance</Statistic.Label>
                    <Statistic.Value>${(unitBalance / 100).toFixed(2)}</Statistic.Value>
                  </Statistic>
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <Button.Group fluid>
                  <Button 
                    color='green' 
                    onClick={() => setDepositModal(true)}
                  >
                    <Icon name='arrow down' /> Deposit
                  </Button>
                  <Button 
                    color='orange' 
                    onClick={() => setWithdrawModal(true)}
                  >
                    <Icon name='arrow up' /> Withdraw
                  </Button>
                  <Button 
                    color='blue' 
                    onClick={() => setConvertModal(true)}
                  >
                    <Icon name='exchange' /> Convert to Stablecoin
                  </Button>
                </Button.Group>
              </Card.Content>
            </Card>
          </Card.Group>
        ) : (
          <Message info>
            <Message.Header>Connecting to Banking API...</Message.Header>
            <p>Initializing Unit.co connection...</p>
          </Message>
        )}
      </Segment>

      {/* Create Account Modal */}
      <Modal
        open={createAccountModal}
        onClose={() => setCreateAccountModal(false)}
      >
        <Modal.Header>Create New Account</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Select
              label='Account Type'
              options={[
                { key: 'checking', text: 'Checking', value: 'CHECKING' },
                { key: 'savings', text: 'Savings', value: 'SAVINGS' }
              ]}
              value={accountType}
              onChange={(_, { value }) => setAccountType(value as string)}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setCreateAccountModal(false)}>Cancel</Button>
          <Button 
            primary 
            loading={isCreatingAccount}
            onClick={handleCreateAccount}
          >
            Create Account
          </Button>
        </Modal.Actions>
      </Modal>
      {/* Deposit Modal */}
<Modal
  open={depositModal}
  onClose={() => setDepositModal(false)}
>
  <Modal.Header>Deposit to Unit Account</Modal.Header>
  <Modal.Content>
    <Form>
      <Message info>
        Current Unit Balance: ${(unitBalance / 100).toFixed(2)}
      </Message>
      <Form.Input
        label='Amount'
        type='number'
        placeholder='0.00'
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
        icon='dollar'
        iconPosition='left'
      />
    </Form>
  </Modal.Content>
  <Modal.Actions>
    <Button onClick={() => setDepositModal(false)}>Cancel</Button>
    <Button 
      primary 
      onClick={handleDeposit}
      disabled={!depositAmount}
    >
      Deposit
    </Button>
  </Modal.Actions>
</Modal>

{/* Withdraw Modal */}
<Modal
  open={withdrawModal}
  onClose={() => setWithdrawModal(false)}
>
  <Modal.Header>Withdraw from Unit Account</Modal.Header>
  <Modal.Content>
    <Form>
      <Message info>
        Available: ${(unitBalance / 100).toFixed(2)}
      </Message>
      <Form.Input
        label='Amount'
        type='number'
        placeholder='0.00'
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
        icon='dollar'
        iconPosition='left'
      />
    </Form>
  </Modal.Content>
  <Modal.Actions>
    <Button onClick={() => setWithdrawModal(false)}>Cancel</Button>
    <Button 
      primary 
      onClick={handleWithdraw}
      disabled={!withdrawAmount}
    >
      Withdraw
    </Button>
  </Modal.Actions>
</Modal>

{/* Convert to Stablecoin Modal */}
<Modal
  open={convertModal}
  onClose={() => setConvertModal(false)}
>
  <Modal.Header>Convert Funds</Modal.Header>
  <Modal.Content>
    <Form>
      <Form.Group inline>
        <label>Direction</label>
        <Form.Radio
          label='Fiat → Stablecoin'
          value='fiat-to-stable'
          checked={convertDirection === 'fiat-to-stable'}
          onChange={() => setConvertDirection('fiat-to-stable')}
        />
        <Form.Radio
          label='Stablecoin → Fiat'
          value='stable-to-fiat'
          checked={convertDirection === 'stable-to-fiat'}
          onChange={() => setConvertDirection('stable-to-fiat')}
        />
      </Form.Group>
      
      <Form.Input
        label='Amount'
        type='number'
        placeholder='0.00'
        value={convertAmount}
        onChange={(e) => setConvertAmount(e.target.value)}
        icon='dollar'
        iconPosition='left'
      />

      {convertDirection === 'fiat-to-stable' && (
        <Message info>
          <Message.Header>Fiat to Stablecoin</Message.Header>
          <p>Your Unit balance: ${(unitBalance / 100).toFixed(2)}</p>
          <p>This will create an issuance request that the bank must approve.</p>
        </Message>
      )}

      {convertDirection === 'stable-to-fiat' && (
        <Message info>
          <Message.Header>Stablecoin to Fiat</Message.Header>
          <p>Your stablecoin balance: ${stablecoins.reduce((sum, s) => sum + parseFloat(s.payload.amount), 0).toFixed(2)}</p>
          <p>This will create a redemption request that the bank must approve.</p>
        </Message>
      )}
    </Form>
  </Modal.Content>
  <Modal.Actions>
    <Button onClick={() => setConvertModal(false)}>Cancel</Button>
    <Button 
      primary 
      onClick={handleConvert}
      disabled={!convertAmount}
    >
      Convert
    </Button>
  </Modal.Actions>
</Modal>
    {/* Debug Panel */}
    <Segment color='grey'>
      <Header as='h3'>
        <Icon name='bug' />
        Debug Information
      </Header>
      
      <Grid columns={2} divided>
        <Grid.Column>
          <Header sub>Balances</Header>
          <Table definition>
            <Table.Body>
              <Table.Row>
                <Table.Cell width={8}>Unit Balance (Mock)</Table.Cell>
                <Table.Cell>
                  <Label color='green' size='large'>
                    ${(unitBalance / 100).toFixed(2)}
                  </Label>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Total Stablecoins (DAML)</Table.Cell>
                <Table.Cell>
                  <Label color='blue' size='large'>
                    ${stablecoins.reduce((sum, s) => sum + parseFloat(s.payload.amount), 0).toFixed(2)}
                  </Label>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Available for Conversion</Table.Cell>
                <Table.Cell>
                  <Label color='olive' size='large'>
                    ${(unitBalance / 100).toFixed(2)}
                  </Label>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Grid.Column>
        
        <Grid.Column>
          <Header sub>Pending Requests</Header>
          <Table definition>
            <Table.Body>
              <Table.Row>
                <Table.Cell width={8}>Issuance Requests</Table.Cell>
                <Table.Cell>
                  <Label color='orange'>
                    {issuanceRequests.filter(r => r.payload.requester === party).length}
                  </Label>
                  {issuanceRequests.filter(r => r.payload.requester === party).length > 0 && (
                    <span style={{ marginLeft: '10px' }}>
                      Total: ${issuanceRequests
                        .filter(r => r.payload.requester === party)
                        .reduce((sum, r) => sum + parseFloat(r.payload.amount), 0)
                        .toFixed(2)}
                    </span>
                  )}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Redemption Requests</Table.Cell>
                <Table.Cell>
                  <Label color='purple'>
                    {redemptionRequests.filter(r => r.payload.redeemer === party).length}
                  </Label>
                  {redemptionRequests.filter(r => r.payload.redeemer === party).length > 0 && (
                    <span style={{ marginLeft: '10px' }}>
                      Total: ${redemptionRequests
                        .filter(r => r.payload.redeemer === party)
                        .reduce((sum, r) => sum + parseFloat(r.payload.holding.amount), 0)
                        .toFixed(2)}
                    </span>
                  )}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Stablecoin Holdings</Table.Cell>
                <Table.Cell>
                  <Label color='blue'>
                    {stablecoins.length}
                  </Label>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Grid.Column>
      </Grid>
      
      <Message info>
        <Message.Header>Mock Banking Notice</Message.Header>
        <p>Unit balances are currently mocked. In production:</p>
        <ul>
          <li>Fiat → Stablecoin: Unit API debits your account, DAML mints stablecoin</li>
          <li>Stablecoin → Fiat: DAML burns stablecoin, Unit API credits your account</li>
          <li>Balances sync automatically via webhooks</li>
        </ul>
      </Message>
    </Segment>

    {/* Detailed Stablecoin Holdings */}
    {stablecoins.length > 0 && (
      <Segment>
        <Header as='h3'>
          <Icon name='money' />
          Your Stablecoin Holdings
        </Header>
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Currency</Table.HeaderCell>
              <Table.HeaderCell>Issuer</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {stablecoins.map((holding, idx) => (
              <Table.Row key={idx}>
                <Table.Cell>
                  <Label color='blue' size='large'>
                    ${parseFloat(holding.payload.amount).toFixed(2)}
                  </Label>
                </Table.Cell>
                <Table.Cell>{holding.payload.currency}</Table.Cell>
                <Table.Cell>{getDisplayName(holding.payload.issuer)}</Table.Cell>
                <Table.Cell>
                  {holding.payload.frozen ? (
                    <Label color='red'>Frozen</Label>
                  ) : (
                    <Label color='green'>Active</Label>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Segment>
      
    )}

      {/* Multi-Chain Wallet Integration */}
      <Segment>
        <Header as='h2'>
          <Icon name='ethereum' />
          Multi-Chain Wallet & Swap
        </Header>
        
        <WalletConnect />
        
        {/* Show swap interface */}
        <div style={{ marginTop: '20px' }}>
          <TokenSwap />
        </div>
      </Segment>
      {/* Add more modals for deposit, withdraw, convert */}
    </Container>
  );
};

export default RealBankingDashboard;