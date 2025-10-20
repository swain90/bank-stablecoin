import React, { useState, useMemo } from 'react';
import { useStreamQueries, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Table, Icon, Dropdown, Message, Dimmer, Loader, Label } from 'semantic-ui-react';
import { TransactionHistory as HistoryContract, TransferProposal } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { getDisplayName } from '../config/parties';

type TransactionType = 'all' | 'transfer' | 'split' | 'merge';

interface Transaction {
  id: string;
  type: 'transfer-sent' | 'transfer-received' | 'split' | 'merge';
  timestamp: string;
  amount: string;
  currency: string;
  from?: string;
  to?: string;
  details: string;
}

const TransactionHistory: React.FC = () => {
  const party = useParty();
  // Query history where current party is the actor (signatory)
  const { contracts: historyContracts, loading } = useStreamQueries(HistoryContract, () => [{actor: party}], [party]);
  const { contracts: proposals } = useStreamQueries(TransferProposal);
  
  const [filterType, setFilterType] = useState<TransactionType>('all');

  // Debug logging
  console.log('Party:', party);
  console.log('History contracts:', historyContracts);
  console.log('Loading:', loading);
  console.log('Number of history entries:', historyContracts.length);

  // Combine history contracts and pending proposals
  const transactions = useMemo(() => {
    const txs: Transaction[] = [];

    // Add completed transactions from history
    historyContracts.forEach(contract => {
      const h = contract.payload;
      let type: Transaction['type'];
      
      if (h.transactionType === 'transfer') {
        type = 'transfer-sent';
      } else if (h.transactionType === 'accept') {
        type = 'transfer-received';
      } else if (h.transactionType === 'split') {
        type = 'split';
      } else if (h.transactionType === 'merge') {
        type = 'merge';
      } else {
        type = 'transfer-sent'; // fallback
      }

      txs.push({
        id: contract.contractId,
        type: type,
        timestamp: h.timestamp,
        amount: h.amount,
        currency: h.currency,
        from: h.fromParty ?? undefined,
        to: h.toParty ?? undefined,
        details: h.details,
      });
    });

    // Add pending transfer proposals
    proposals.forEach(proposal => {
      if (proposal.payload.coin.owner === party) {
        txs.push({
          id: proposal.contractId,
          type: 'transfer-sent',
          timestamp: new Date().toISOString(),
          amount: proposal.payload.coin.amount,
          currency: proposal.payload.coin.currency,
          from: proposal.payload.coin.owner,
          to: proposal.payload.newOwner,
          details: `⏳ Pending transfer to ${getDisplayName(proposal.payload.newOwner)}`,
        });
      } else if (proposal.payload.newOwner === party) {
        txs.push({
          id: proposal.contractId,
          type: 'transfer-received',
          timestamp: new Date().toISOString(),
          amount: proposal.payload.coin.amount,
          currency: proposal.payload.coin.currency,
          from: proposal.payload.coin.owner,
          to: proposal.payload.newOwner,
          details: `⏳ Pending transfer from ${getDisplayName(proposal.payload.coin.owner)}`,
        });
      }
    });

    return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyContracts, proposals, party]);

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    
    return transactions.filter(tx => {
      if (filterType === 'transfer') {
        return tx.type === 'transfer-sent' || tx.type === 'transfer-received';
      }
      if (filterType === 'split') return tx.type === 'split';
      if (filterType === 'merge') return tx.type === 'merge';
      return true;
    });
  }, [transactions, filterType]);

  const filterOptions = [
    { key: 'all', text: 'All Transactions', value: 'all' },
    { key: 'transfer', text: 'Transfers Only', value: 'transfer' },
    { key: 'split', text: 'Splits Only', value: 'split' },
    { key: 'merge', text: 'Merges Only', value: 'merge' },
  ];

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'transfer-sent':
        return <Icon name='arrow up' color='orange' />;
      case 'transfer-received':
        return <Icon name='arrow down' color='green' />;
      case 'split':
        return <Icon name='cut' color='teal' />;
      case 'merge':
        return <Icon name='compress' color='purple' />;
      default:
        return <Icon name='circle' />;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'transfer-sent':
        return <Label color='orange'>Sent</Label>;
      case 'transfer-received':
        return <Label color='green'>Received</Label>;
      case 'split':
        return <Label color='teal'>Split</Label>;
      case 'merge':
        return <Label color='purple'>Merged</Label>;
      default:
        return <Label>Unknown</Label>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              Transaction History
            </Header>

            <Segment>
              <Header as='h2'>
                <Icon name='history' />
                <Header.Content>
                  Your Transaction Log
                  <Header.Subheader>View all past and pending transactions</Header.Subheader>
                </Header.Content>
              </Header>

              <div style={{ marginBottom: '1em' }}>
                <Dropdown
                  selection
                  options={filterOptions}
                  value={filterType}
                  onChange={(e, { value }) => setFilterType(value as TransactionType)}
                  style={{ minWidth: '200px' }}
                />
              </div>

              <Message info>
                <Message.Header>Transaction History</Message.Header>
                <p>
                  Showing all completed transactions (transfers, splits, merges) and pending transfer proposals.
                  History is automatically recorded when you perform operations.
                </p>
              </Message>

              {loading ? (
                <Dimmer active inverted>
                  <Loader>Loading transaction history...</Loader>
                </Dimmer>
              ) : filteredTransactions.length === 0 ? (
                <Message warning>
                  <Message.Header>No Transactions Found</Message.Header>
                  <p>You don't have any {filterType === 'all' ? '' : filterType} transactions yet.</p>
                </Message>
              ) : (
                <Table celled striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell width={2}>Type</Table.HeaderCell>
                      <Table.HeaderCell width={3}>Amount</Table.HeaderCell>
                      <Table.HeaderCell width={3}>From/To</Table.HeaderCell>
                      <Table.HeaderCell width={5}>Details</Table.HeaderCell>
                      <Table.HeaderCell width={3}>Timestamp</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {filteredTransactions.map((tx) => (
                      <Table.Row key={tx.id}>
                        <Table.Cell>
                          {getTransactionIcon(tx.type)}
                          {getTransactionLabel(tx.type)}
                        </Table.Cell>
                        <Table.Cell>
                          <strong>${parseFloat(tx.amount).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}</strong> {tx.currency}
                        </Table.Cell>
                        <Table.Cell>
                          {tx.from && (
                            <div>
                              <Icon name='user' />
                              From: {getDisplayName(tx.from)}
                            </div>
                          )}
                          {tx.to && (
                            <div>
                              <Icon name='user' />
                              To: {getDisplayName(tx.to)}
                            </div>
                          )}
                        </Table.Cell>
                        <Table.Cell>{tx.details}</Table.Cell>
                        <Table.Cell>{formatTimestamp(tx.timestamp)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
};

export default TransactionHistory;