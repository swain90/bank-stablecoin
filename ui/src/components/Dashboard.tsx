import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Form, Modal, Dropdown, DropdownProps, Loader, Dimmer } from 'semantic-ui-react';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { getAllParties, getDisplayName } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const Dashboard: React.FC = () => {
  const party = useParty();
  React.useEffect(() => {
    showSuccess('Dashboard loaded!');
  }, []);

  const ledger = useLedger();
  const { contracts: holdings, loading } = useStreamQueries(StablecoinHolding);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [selectedHoldings, setSelectedHoldings] = useState<any[]>([]);
  const [newOwner, setNewOwner] = useState('');
  const [splitAmount, setSplitAmount] = useState('');

  const totalBalance = holdings.reduce((sum, h) => sum + parseFloat(h.payload.amount), 0);

  // Create dropdown options for other parties (exclude current user)
  const partyOptions = getAllParties()
    .filter(p => p.partyId !== party)
    .map(p => ({
      key: p.partyId,
      text: `${p.displayName} (${p.role})`,
      value: p.partyId
    }))
    .concat([{
      key: 'custom',
      text: '+ Enter Custom Party ID',
      value: 'custom'
    }]);

  const handleTransferClick = (holding: any) => {
    setSelectedHolding(holding);
    setTransferModalOpen(true);
  };

  const handleSplitClick = (holding: any) => {
    setSelectedHolding(holding);
    setSplitAmount('');
    setSplitModalOpen(true);
  };

  const handleMergeClick = () => {
    setSelectedHoldings([]);
    setMergeModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedHolding || !newOwner) return;

    try {
      await ledger.exercise(StablecoinHolding.Transfer, selectedHolding.contractId, {
        newOwner: newOwner,
      });
      setTransferModalOpen(false);
      setNewOwner('');
      setSelectedHolding(null);
      showSuccess(`Transfer proposal created! Sent to ${getDisplayName(newOwner)}`);
    } catch (error) {
      alert(`Transfer failed:\n${JSON.stringify(error)}`);
    }
    

  };

  const handleSplit = async () => {
    if (!selectedHolding || !splitAmount) return;

    const amount = parseFloat(splitAmount);
    const maxAmount = parseFloat(selectedHolding.payload.amount);

    if (isNaN(amount) || amount <= 0 || amount >= maxAmount) {
      alert(`Invalid split amount. Must be between 0 and ${maxAmount}`);
      return;
    }

    try {
      await ledger.exercise(StablecoinHolding.Split, selectedHolding.contractId, {
        splitAmount: amount.toString(),
      });
      setSplitModalOpen(false);
      setSplitAmount('');
      setSelectedHolding(null);
      showSuccess(`Split proposal created! Sent to ${getDisplayName(newOwner)}`);
    } catch (error) {
      alert(`Split failed:\n${JSON.stringify(error)}`);
    }
    
  };

  const handleMerge = async () => {
    if (selectedHoldings.length !== 2) {
      alert('Please select exactly 2 holdings to merge');
      return;
    }

    const [holding1, holding2] = selectedHoldings;

    // Validate same currency and issuer
    if (holding1.payload.currency !== holding2.payload.currency) {
      alert('Cannot merge holdings with different currencies');
      return;
    }

    if (holding1.payload.issuer !== holding2.payload.issuer) {
      alert('Cannot merge holdings from different issuers');
      return;
    }

    try {
      await ledger.exercise(StablecoinHolding.Merge, holding1.contractId, {
        otherCoinCid: holding2.contractId,
      });
      setMergeModalOpen(false);
      setSelectedHoldings([]);
      showSuccess(`Merge proposal created! Sent to ${getDisplayName(newOwner)}`);
    } catch (error) {
      alert(`Merge failed:\n${JSON.stringify(error)}`);
    }
    
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <Container style={{ marginTop: '2em' }}>
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
                <Header.Content>
                  Your Holdings
                  {holdings.length >= 2 && (
                    <Button 
                      floated='right' 
                      color='purple' 
                      size='small'
                      onClick={handleMergeClick}
                    >
                      <Icon name='compress' />
                      Merge Holdings
                    </Button>
                  )}
                </Header.Content>
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
                          <div>Issuer: {getDisplayName(holding.payload.issuer)}</div>
                          <div>Owner: {getDisplayName(holding.payload.owner)}</div>
                        </Card.Meta>
                        {holding.payload.frozen && (
                          <Card.Description style={{ color: 'red', marginTop: '0.5em' }}>
                            ⚠️ Account Frozen - Transfers Disabled
                          </Card.Description>
                        )}
                      </Card.Content>
                      <Card.Content extra>
                        <Button.Group fluid>
                          <Button
                            primary
                            disabled={holding.payload.frozen}
                            onClick={() => handleTransferClick(holding)}
                          >
                            <Icon name='exchange' />
                            Transfer
                          </Button>
                          <Button
                            color='teal'
                            disabled={holding.payload.frozen}
                            onClick={() => handleSplitClick(holding)}
                          >
                            <Icon name='cut' />
                            Split
                          </Button>
                        </Button.Group>
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
              <label>Select Recipient</label>
              <Dropdown
                placeholder='Select a party or enter custom ID'
                fluid
                search
                selection
                allowAdditions
                options={partyOptions}
                value={newOwner}
                onAddItem={(e: React.SyntheticEvent, data: DropdownProps) => setNewOwner(data.value as string)}
                onChange={(e: React.SyntheticEvent, data: DropdownProps) => setNewOwner(data.value as string)}
                additionLabel="Custom Party ID: "
              />
            </Form.Field>
            {selectedHolding && (
              <Segment>
                <p><strong>Amount:</strong> ${parseFloat(selectedHolding.payload.amount).toFixed(2)} {selectedHolding.payload.currency}</p>
                <p><strong>From:</strong> {getDisplayName(selectedHolding.payload.owner)}</p>
                {newOwner && newOwner !== 'custom' && (
                  <p><strong>To:</strong> {getDisplayName(newOwner)}</p>
                )}
              </Segment>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setTransferModalOpen(false)}>Cancel</Button>
          <Button primary disabled={!newOwner || newOwner === 'custom'} onClick={handleTransfer}>
            Create Transfer Proposal
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Split Modal */}
      <Modal open={splitModalOpen} onClose={() => setSplitModalOpen(false)} size='small'>
        <Modal.Header>Split Stablecoin Holding</Modal.Header>
        <Modal.Content>
          <Form>
            {selectedHolding && (
              <Segment color='blue'>
                <Header as='h4'>Current Holding</Header>
                <p><strong>Total Amount:</strong> ${parseFloat(selectedHolding.payload.amount).toFixed(2)} {selectedHolding.payload.currency}</p>
                <p><strong>Owner:</strong> {getDisplayName(selectedHolding.payload.owner)}</p>
              </Segment>
            )}
            <Form.Field>
              <label>Split Amount (First Holding)</label>
              <Form.Input
                type='number'
                placeholder='Enter amount...'
                value={splitAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSplitAmount(e.target.value)}
                step='0.01'
                min='0.01'
                max={selectedHolding ? parseFloat(selectedHolding.payload.amount) - 0.01 : undefined}
              />
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em' }}>
                Must be greater than 0 and less than total amount
              </p>
            </Form.Field>
            {selectedHolding && splitAmount && parseFloat(splitAmount) > 0 && (
              <Segment color='green'>
                <Header as='h4'>Result Preview</Header>
                <p>✂️ <strong>First Holding:</strong> ${parseFloat(splitAmount).toFixed(2)} {selectedHolding.payload.currency}</p>
                <p>✂️ <strong>Second Holding:</strong> ${(parseFloat(selectedHolding.payload.amount) - parseFloat(splitAmount)).toFixed(2)} {selectedHolding.payload.currency}</p>
              </Segment>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setSplitModalOpen(false)}>Cancel</Button>
          <Button color='teal' disabled={!splitAmount || parseFloat(splitAmount) <= 0} onClick={handleSplit}>
            <Icon name='cut' />
            Split Holding
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Merge Modal */}
      <Modal open={mergeModalOpen} onClose={() => setMergeModalOpen(false)} size='small'>
        <Modal.Header>Merge Stablecoin Holdings</Modal.Header>
        <Modal.Content>
          <Header as='h4'>Select 2 holdings to merge</Header>
          <p style={{ marginBottom: '1em', color: '#666' }}>
            Holdings must have the same currency and issuer
          </p>
          <Card.Group>
            {holdings.map((holding) => {
              const isSelected = selectedHoldings.some(h => h.contractId === holding.contractId);
              const canSelect = selectedHoldings.length < 2 || isSelected;
              
              return (
                <Card 
                  key={holding.contractId} 
                  fluid
                  color={isSelected ? 'purple' : undefined}
                  style={{ 
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: canSelect ? 1 : 0.5
                  }}
                  onClick={() => {
                    if (!canSelect) return;
                    
                    if (isSelected) {
                      setSelectedHoldings(selectedHoldings.filter(h => h.contractId !== holding.contractId));
                    } else {
                      setSelectedHoldings([...selectedHoldings, holding]);
                    }
                  }}
                >
                  <Card.Content>
                    <Card.Header>
                      {isSelected && <Icon name='check circle' color='purple' />}
                      ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                    </Card.Header>
                    <Card.Meta>
                      <div>Issuer: {getDisplayName(holding.payload.issuer)}</div>
                    </Card.Meta>
                  </Card.Content>
                </Card>
              );
            })}
          </Card.Group>
          
          {selectedHoldings.length === 2 && (
            <Segment color='purple' style={{ marginTop: '1em' }}>
              <Header as='h4'>Merge Preview</Header>
              <p><strong>Combined Amount:</strong> ${(
                parseFloat(selectedHoldings[0].payload.amount) + 
                parseFloat(selectedHoldings[1].payload.amount)
              ).toFixed(2)} {selectedHoldings[0].payload.currency}</p>
              <p><strong>Issuer:</strong> {getDisplayName(selectedHoldings[0].payload.issuer)}</p>
              <p><strong>Owner:</strong> {getDisplayName(selectedHoldings[0].payload.owner)}</p>
            </Segment>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setMergeModalOpen(false)}>Cancel</Button>
          <Button 
            color='purple' 
            disabled={selectedHoldings.length !== 2} 
            onClick={handleMerge}
          >
            <Icon name='compress' />
            Merge Holdings
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default Dashboard;