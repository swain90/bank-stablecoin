import React, { useState, useEffect } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Form, Modal, Statistic, Label, List, SemanticICONS } from 'semantic-ui-react';
import { FiatBankAccount } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/RealBankAccount';
import { showSuccess, showError, showWarning } from './Toast';
import { BankReserve } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { ContractId } from '@daml/types';

const RealBankingDashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: fiatAccounts, loading } = useStreamQueries(FiatBankAccount);
  
  const [unitToken, setUnitToken] = useState<string | null>(null);
  const [createAccountModal, setCreateAccountModal] = useState(false);
  const [accountType, setAccountType] = useState('CHECKING');
  
  // Initialize Unit.co SDK
  useEffect(() => {
    const initUnit = async () => {
      const response = await fetch('/api/unit/customer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId: party })
      });
      const data = await response.json();
      setUnitToken(data.token);
    };
    
    initUnit();
  }, [party]);
  
  const createBankAccount = async () => {
    try {
      // Create account via Unit API
      const response = await fetch('/api/unit/create-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${unitToken}`
        },
        body: JSON.stringify({
          type: accountType,
          customerId: party
        })
      });
      
      const accountData = await response.json();
      
      // Create corresponding Daml contract
      await ledger.create(FiatBankAccount, {
        bank: 'Bank::...',
        user: party,
        accountNumber: accountData.attributes.accountNumber,
        routingNumber: accountData.attributes.routingNumber,
        accountType: accountType,
        balance: '0.0',
        currency: 'USD',
        fdicInsured: true,
        provider: 'Unit',
        externalAccountId: accountData.id,
        status: 'ACTIVE'
      });
      
      showSuccess(`${accountType} account created successfully!`);
      setCreateAccountModal(false);
    } catch (error) {
      if (error instanceof Error) {
        showError(`Failed to create account: ${error.message}`);
      } else {
        showError('Failed to create account: An unknown error occurred.');
      }
    }
  };
  
  const handleMintStablecoin = async (accountCid: ContractId<FiatBankAccount>, amount: number) => {
    // Get reserve contract
    const reserves = await ledger.query(BankReserve);
    
    await ledger.exercise(
      FiatBankAccount.MintStablecoin,
      accountCid,
      { 
        amount: amount.toString(),
        reserveCid: reserves[0].contractId
      }
    );
    
    showSuccess(`Minted ${amount} stablecoins from fiat!`);
  };
  
  const totalFiatBalance = fiatAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.payload.balance), 
    0
  );
  
  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as="h1" color="green">
        <Icon name="university" />
        Real Banking Dashboard
      </Header>
      
      {/* Account Summary */}
      <Segment>
        <Statistic.Group widths="three">
          <Statistic>
            <Statistic.Value>
              ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Statistic.Value>
            <Statistic.Label>Total Fiat Balance</Statistic.Label>
          </Statistic>
          <Statistic>
            <Statistic.Value>{fiatAccounts.length}</Statistic.Value>
            <Statistic.Label>Bank Accounts</Statistic.Label>
          </Statistic>
          <Statistic color="green">
            <Statistic.Value>
              <Icon name="check circle" />
              FDIC
            </Statistic.Value>
            <Statistic.Label>Insured</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </Segment>
      
      {/* Create Account Button */}
      <Button primary size="large" onClick={() => setCreateAccountModal(true)}>
        <Icon name="plus" />
        Open New Bank Account
      </Button>
      
      {/* Bank Accounts */}
      <Header as="h2" style={{ marginTop: '2em' }}>
        Your Bank Accounts
      </Header>
      
      <Card.Group>
        {fiatAccounts.map(account => (
          <Card key={account.contractId} fluid color="green">
            <Card.Content>
              <Card.Header>
                <Icon name={account.payload.accountType === 'CHECKING' ? 'credit card' : 'piggy bank' as SemanticICONS} />
                {account.payload.accountType} Account
                {account.payload.fdicInsured && (
                  <Label color="green" size="tiny" style={{ marginLeft: '1em' }}>
                    FDIC Insured
                  </Label>
                )}
              </Card.Header>
              <Card.Meta>
                <div>Account: ****{account.payload.accountNumber.slice(-4)}</div>
                <div>Routing: {account.payload.routingNumber}</div>
              </Card.Meta>
              <Card.Description>
                <Statistic size="small">
                  <Statistic.Value>
                    ${parseFloat(account.payload.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Statistic.Value>
                  <Statistic.Label>Available Balance</Statistic.Label>
                </Statistic>
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <Button.Group fluid>
                <Button color="blue">
                  <Icon name="arrow up" />
                  Deposit
                </Button>
                <Button color="orange">
                  <Icon name="arrow down" />
                  Withdraw
                </Button>
                <Button color="purple" onClick={() => handleMintStablecoin(account.contractId, 100)}>
                  <Icon name="exchange" />
                  Convert to Stablecoin
                </Button>
              </Button.Group>
            </Card.Content>
          </Card>
        ))}
      </Card.Group>
      
      {/* Create Account Modal */}
      <Modal open={createAccountModal} onClose={() => setCreateAccountModal(false)}>
        <Modal.Header>Open New Bank Account</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>Account Type</label>
              <Form.Dropdown
                selection
                options={[
                  { key: 'checking', text: '💳 Checking Account', value: 'CHECKING' },
                  { key: 'savings', text: '🐷 Savings Account (Earn Interest)', value: 'SAVINGS' }
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
                  FDIC Insured up to $250,000
                </List.Item>
                <List.Item>
                  <Icon name="check" color="green" />
                  Free ACH transfers
                </List.Item>
                <List.Item>
                  <Icon name="check" color="green" />
                  Instant conversion to stablecoins
                </List.Item>
                {accountType === 'SAVINGS' && (
                  <List.Item>
                    <Icon name="check" color="green" />
                    Earn 4.5% APY interest
                  </List.Item>
                )}
              </List>
            </Segment>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setCreateAccountModal(false)}>Cancel</Button>
          <Button primary onClick={createBankAccount}>
            <Icon name="university" />
            Open Account
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default RealBankingDashboard;