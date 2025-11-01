import React, { useState, useEffect } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { 
  Container, Grid, Header, Segment, Card, Button, Icon, 
  Form, Modal, Statistic, Label, List, Loader, Dropdown,
  Table, Message
} from 'semantic-ui-react';
import { FiatBankAccount, SavingsAccount, AccountOpeningRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/RealBankAccount';
import { StablecoinHolding, BankReserve } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { showSuccess, showError, showWarning } from './Toast';
import { getDisplayName } from '../config/parties';

const RealBankingDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  
  const { contracts: fiatAccounts, loading: accountsLoading } = useStreamQueries(FiatBankAccount);
  const { contracts: savingsAccounts, loading: savingsLoading } = useStreamQueries(SavingsAccount);
  const { contracts: accountRequests, loading: requestsLoading } = useStreamQueries(AccountOpeningRequest);
  const { contracts: stablecoins } = useStreamQueries(StablecoinHolding);
  const { contracts: reserves } = useStreamQueries(BankReserve);
  
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
  
  const [unitCustomerId, setUnitCustomerId] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    const initUnit = async () => {
      try {
        console.log('Initializing Unit customer for party:', party);
        
        const response = await fetch('/api/unit/get-or-create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partyId: party })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to initialize Unit customer: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Unit API response:', data);
        
        if (data.success) {
          setUnitCustomerId(data.customerId);
          console.log('✓ Unit customer created:', data.customerId);
          showSuccess('Banking API connected successfully!');
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error: any) {
        console.error('Failed to initialize Unit customer:', error);
        showError(`Banking API error: ${error.message}`);
      }
    };
    
    if (party) {
      initUnit();
    }
  }, [party]);

  const totalFiatBalance = fiatAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.payload.balance), 
    0
  );
  
  const totalStablecoinBalance = stablecoins.reduce(
    (sum, sc) => sum + parseFloat(sc.payload.amount), 
    0
  );

  const handleCreateAccount = async () => {
    if (!unitCustomerId) {
      showError('Unit customer not initialized. Please refresh the page.');
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      console.log('Creating account with Unit...');
      console.log('Customer ID:', unitCustomerId);
      console.log('Account Type:', accountType);
      
      const response = await fetch('/api/unit/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: unitCustomerId,
          type: accountType
        })
      });
      
      console.log('Create account response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create account error:', errorText);
        throw new Error('Failed to create account with Unit');
      }
      
      const accountData = await response.json();
      console.log('Account created:', accountData);
      
      // For now, just show success - in production you'd create the Daml contract
      showSuccess(`${accountType} account created successfully! Account: ${accountData.attributes.accountNumber}`);
      setCreateAccountModal(false);
      
    } catch (error: any) {
      console.error('Account creation failed:', error);
      showError(`Failed to create account: ${error.message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedAccount || !depositAmount) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Invalid deposit amount');
      return;
    }

    try {
      await ledger.exercise(
        FiatBankAccount.DepositFiat,
        selectedAccount.contractId,
        {
          amount: amount.toString(),
          source: 'External Bank Transfer',
          transactionId: `TXN-${Date.now()}`
        }
      );
      
      showSuccess(`Deposited $${amount.toFixed(2)} successfully!`);
      setDepositModal(false);
      setDepositAmount('');
      
    } catch (error: any) {
      showError(`Deposit failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedAccount || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Invalid withdrawal amount');
      return;
    }
    
    if (amount > parseFloat(selectedAccount.payload.balance)) {
      showError('Insufficient balance');
      return;
    }

    try {
      await ledger.exercise(
        FiatBankAccount.WithdrawFiat,
        selectedAccount.contractId,
        {
          amount: amount.toString(),
          destination: 'External Bank Account',
          transactionId: `TXN-${Date.now()}`
        }
      );
      
      showSuccess(`Withdrew $${amount.toFixed(2)} successfully!`);
      setWithdrawModal(false);
      setWithdrawAmount('');
      
    } catch (error: any) {
      showError(`Withdrawal failed: ${error.message}`);
    }
  };

  const handleConvert = async () => {
    if (!selectedAccount || !convertAmount) return;
    
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Invalid conversion amount');
      return;
    }
    
    if (!reserves || reserves.length === 0) {
      showError('No reserve contract found');
      return;
    }

    try {
      if (convertDirection === 'fiat-to-stable') {
        if (amount > parseFloat(selectedAccount.payload.balance)) {
          showError('Insufficient fiat balance');
          return;
        }
        
        await ledger.exercise(
          FiatBankAccount.MintStablecoin,
          selectedAccount.contractId,
          {
            amount: amount.toString(),
            reserveCid: reserves[0].contractId
          }
        );
        
        showSuccess(`Converted $${amount.toFixed(2)} fiat to stablecoin!`);
        
      } else {
        const availableStablecoin = stablecoins.find(
          sc => parseFloat(sc.payload.amount) >= amount && sc.payload.currency === 'USD'
        );
        
        if (!availableStablecoin) {
          showError('Insufficient stablecoin balance');
          return;
        }
        
        await ledger.exercise(
          FiatBankAccount.BurnStablecoin,
          selectedAccount.contractId,
          {
            stablecoinCid: availableStablecoin.contractId,
            reserveCid: reserves[0].contractId
          }
        );
        
        showSuccess(`Converted ${amount.toFixed(2)} stablecoin to fiat!`);
      }
      
      setConvertModal(false);
      setConvertAmount('');
      
    } catch (error: any) {
      showError(`Conversion failed: ${error.message}`);
    }
  };

  if (accountsLoading || savingsLoading) {
    return (
      <Container style={{ marginTop: '2em', textAlign: 'center' }}>
        <Loader active size="large">Loading bank accounts...</Loader>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as="h1" color="green">
        <Icon name="university" />
        Real Banking Dashboard
        <Header.Subheader>FDIC-Insured Bank Accounts + Unit.co Integration</Header.Subheader>
      </Header>

      {/* Connection Status */}
      <Message 
        info={!!unitCustomerId} 
        warning={!unitCustomerId}
        icon
      >
        <Icon name={unitCustomerId ? 'check circle' : 'warning sign'} />
        <Message.Content>
          <Message.Header>
            {unitCustomerId ? 'Banking API Connected' : 'Connecting to Banking API...'}
          </Message.Header>
          {unitCustomerId ? (
            <p>Customer ID: {unitCustomerId}</p>
          ) : (
            <p>Initializing Unit.co connection...</p>
          )}
        </Message.Content>
      </Message>

      {/* Balance Overview */}
      <Segment>
        <Statistic.Group widths="three">
          <Statistic color="green">
            <Statistic.Value>
              ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Statistic.Value>
            <Statistic.Label>Total Fiat Balance</Statistic.Label>
          </Statistic>
          
          <Statistic color="blue">
            <Statistic.Value>
              {totalStablecoinBalance.toFixed(2)}
            </Statistic.Value>
            <Statistic.Label>Stablecoin Balance</Statistic.Label>
          </Statistic>
          
          <Statistic>
            <Statistic.Value>{fiatAccounts.length}</Statistic.Value>
            <Statistic.Label>Bank Accounts</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </Segment>

      {/* Quick Actions */}
      <Segment>
        <Button.Group fluid size="large">
          <Button 
            primary 
            onClick={() => setCreateAccountModal(true)}
            disabled={!unitCustomerId}
          >
            <Icon name="plus circle" />
            Open New Account
          </Button>
          <Button color="green" disabled={fiatAccounts.length === 0}>
            <Icon name="exchange" />
            Transfer Between Accounts
          </Button>
        </Button.Group>
      </Segment>

      {/* Pending Requests */}
      {accountRequests.length > 0 && (
        <Message info>
          <Message.Header>Pending Account Requests</Message.Header>
          <p>You have {accountRequests.length} account opening request(s) pending bank approval.</p>
        </Message>
      )}

      {/* Bank Accounts */}
      <Header as="h2" style={{ marginTop: '2em' }}>
        <Icon name="credit card outline" />
        Your Bank Accounts
      </Header>

      {fiatAccounts.length === 0 ? (
        <Segment placeholder>
          <Header icon>
            <Icon name="university" />
            No bank accounts yet
          </Header>
          <Button 
            primary 
            onClick={() => setCreateAccountModal(true)}
            disabled={!unitCustomerId}
          >
            Open Your First Account
          </Button>
        </Segment>
      ) : (
        <Card.Group>
          {fiatAccounts.map(account => {
            const isChecking = account.payload.accountType === 'CHECKING';
            const isFrozen = account.payload.status === 'FROZEN';
            
            return (
              <Card key={account.contractId} fluid color={isChecking ? 'blue' : 'green'}>
                <Card.Content>
                  <Card.Header>
                    <Icon name={isChecking ? 'credit card' : 'money bill alternate outline'} />
                    {account.payload.accountType} Account
                    {account.payload.fdicInsured && (
                      <Label color="green" size="tiny" style={{ marginLeft: '1em' }}>
                        FDIC Insured
                      </Label>
                    )}
                    {isFrozen && (
                      <Label color="red" size="tiny" style={{ marginLeft: '0.5em' }}>
                        FROZEN
                      </Label>
                    )}
                  </Card.Header>
                  
                  <Card.Meta style={{ marginTop: '0.5em' }}>
                    <div>Account: ••••{account.payload.accountNumber.slice(-4)}</div>
                    <div>Routing: {account.payload.routingNumber}</div>
                    <div>Provider: {account.payload.provider}</div>
                  </Card.Meta>
                  
                  <Card.Description style={{ marginTop: '1em' }}>
                    <Statistic size="small">
                      <Statistic.Value>
                        ${parseFloat(account.payload.balance).toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </Statistic.Value>
                      <Statistic.Label>Available Balance</Statistic.Label>
                    </Statistic>
                  </Card.Description>
                </Card.Content>
                
                <Card.Content extra>
                  <Button.Group fluid>
                    <Button 
                      color="blue" 
                      disabled={isFrozen}
                      onClick={() => {
                        setSelectedAccount(account);
                        setDepositModal(true);
                      }}
                    >
                      <Icon name="arrow up" />
                      Deposit
                    </Button>
                    <Button 
                      color="orange"
                      disabled={isFrozen}
                      onClick={() => {
                        setSelectedAccount(account);
                        setWithdrawModal(true);
                      }}
                    >
                      <Icon name="arrow down" />
                      Withdraw
                    </Button>
                    <Button 
                      color="purple"
                      disabled={isFrozen}
                      onClick={() => {
                        setSelectedAccount(account);
                        setConvertModal(true);
                      }}
                    >
                      <Icon name="exchange" />
                      Convert
                    </Button>
                  </Button.Group>
                </Card.Content>
              </Card>
            );
          })}
        </Card.Group>
      )}

      {/* Create Account Modal */}
      <Modal open={createAccountModal} onClose={() => setCreateAccountModal(false)} size="small">
        <Modal.Header>
          <Icon name="university" />
          Open New Bank Account
        </Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Account Type</label>
              <Dropdown
                selection
                fluid
                options={[
                  { 
                    key: 'checking', 
                    text: '💳 Checking Account', 
                    value: 'CHECKING',
                    description: 'For everyday transactions'
                  },
                  { 
                    key: 'savings', 
                    text: '🐷 Savings Account', 
                    value: 'SAVINGS',
                    description: 'Earn 4.5% APY interest'
                  }
                ]}
                value={accountType}
                onChange={(e, { value }) => setAccountType(value as string)}
              />
            </Form.Field>
            
            <Segment color="green">
              <Header as="h4">Account Benefits</Header>
              <List>
                <List.Item>
                  <Icon name="check" color="green" />
                  <List.Content>FDIC Insured up to $250,000</List.Content>
                </List.Item>
                <List.Item>
                  <Icon name="check" color="green" />
                  <List.Content>Free ACH transfers</List.Content>
                </List.Item>
                <List.Item>
                  <Icon name="check" color="green" />
                  <List.Content>Instant conversion to stablecoins</List.Content>
                </List.Item>
                <List.Item>
                  <Icon name="check" color="green" />
                  <List.Content>No monthly maintenance fees</List.Content>
                </List.Item>
                {accountType === 'SAVINGS' && (
                  <List.Item>
                    <Icon name="star" color="yellow" />
                    <List.Content><strong>Earn 4.5% APY interest</strong></List.Content>
                  </List.Item>
                )}
              </List>
            </Segment>
            
            <Message info>
              <Message.Header>Demo Mode</Message.Header>
              <p>This will create a real sandbox account with Unit.co for testing purposes.</p>
            </Message>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setCreateAccountModal(false)}>Cancel</Button>
          <Button 
            primary 
            loading={isCreatingAccount}
            disabled={!unitCustomerId || isCreatingAccount}
            onClick={handleCreateAccount}
          >
            <Icon name="university" />
            Open {accountType} Account
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Deposit, Withdraw, Convert Modals - keeping them the same */}
      {/* ... rest of your modals ... */}
      
    </Container>
  );
};

export default RealBankingDashboard;