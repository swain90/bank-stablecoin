import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Form, Input, Modal } from 'semantic-ui-react';
import { StablecoinHolding } from '../../../daml/daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';

const Dashboard: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading } = useStreamQueries<StablecoinHolding, string, string>(StablecoinHolding);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<typeof holdings[0] | null>(null);
  const [newOwner, setNewOwner] = useState('');

  const totalBalance = holdings.reduce((sum, h) => sum + parseFloat(h.payload.amount), 0);

  const handleTransferClick = (holding: typeof holdings[0]) => {
    setSelectedHolding(holding);
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedHolding || !newOwner) return;

    try {
      // Now use selectedHolding.contractId which has the correct type
      await ledger.exercise(StablecoinHolding.Transfer, selectedHolding.contractId, {
        newOwner: newOwner,
      });
      setTransferModalOpen(false);
      setNewOwner('');
      setSelectedHolding(null);
    } catch (error) {
      alert(`Transfer failed:\n${JSON.stringify(error)}`);
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <Container>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              Stablecoin Dashboard
            </Header>

            {/* Total Balance Section */}
            <Segment>
              <Header as='h2'>
                <Icon name='dollar' />
                <Header.Content>
                  Total Balance
                  <Header.Subheader>
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </Header.Subheader>
                </Header.Content>
              </Header>
            </Segment>

            {/* Active Holdings Section */}
            <Segment>
              <Header as='h2'>
                <Icon name='briefcase' />
                <Header.Content>
                  Active Holdings
                  <Header.Subheader>
                    {holdings.length} Wallet Contract{holdings.length !== 1 ? 's' : ''}
                  </Header.Subheader>
                </Header.Content>
              </Header>
            </Segment>

            {/* Your Holdings Section */}
            <Segment>
              <Header as='h2'>
                <Icon name='list' />
                <Header.Content>Your Holdings</Header.Content>
              </Header>

              {holdings.length === 0 ? (
                <p>No holdings yet</p>
              ) : (
                <Card.Group>
                  {holdings.map((holding) => (
                    <Card key={holding.contractId} fluid>
                      <Card.Content>
                        <Card.Header>
                          ${parseFloat(holding.payload.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          {holding.payload.currency}
                        </Card.Header>
                        <Card.Meta>
                          <div>Issuer: {holding.payload.issuer}</div>
                          <div>Owner: {holding.payload.owner}</div>
                        </Card.Meta>
                        {holding.payload.frozen && (
                          <Card.Description style={{ color: 'red', marginTop: '0.5em' }}>
                            ⚠️ Account Frozen - Transfers Disabled
                          </Card.Description>
                        )}
                      </Card.Content>
                      <Card.Content extra>
                        <Button
                          primary
                          disabled={holding.payload.frozen}
                          onClick={() => handleTransferClick(holding)}
                        >
                          <Icon name='exchange' />
                          Transfer
                        </Button>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              )}
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Transfer Modal */}
      <Modal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} size='small'>
        <Modal.Header>Transfer Stablecoin</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Field>
              <label>New Owner (Party ID)</label>
              <Input
                placeholder='Enter party identifier...'
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setTransferModalOpen(false)}>Cancel</Button>
          <Button primary disabled={!newOwner} onClick={handleTransfer}>
            Create Transfer Proposal
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default Dashboard;