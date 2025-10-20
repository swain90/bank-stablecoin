import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Table, Button, Icon, Modal, Form, Input, Message, Label, Dimmer, Loader } from 'semantic-ui-react';
import { StablecoinHolding } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { ComplianceOfficer } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Compliance';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const ComplianceManagement: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: allHoldings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: complianceOfficers, loading: complianceLoading } = useStreamQueries(ComplianceOfficer);

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [unfreezeModalOpen, setUnfreezeModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';
  const isBank = party === bankParty;

  // Find the compliance officer contract for the current party
  const complianceOfficer = complianceOfficers.find(co => co.payload.officer === party);

  const frozenHoldings = allHoldings.filter(h => h.payload.frozen);
  const activeHoldings = allHoldings.filter(h => !h.payload.frozen);

  const handleFreeze = async () => {
    if (!selectedHolding || !freezeReason.trim()) {
      showWarning('Please provide a reason for freezing');
      return;
    }

    if (!complianceOfficer) {
      showError('Compliance officer contract not found', 'Cannot perform freeze operation');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Freezing account:', {
        complianceOfficerCid: complianceOfficer.contractId,
        holdingCid: selectedHolding.contractId,
        holdingOwner: selectedHolding.payload.owner,
        holdingAmount: selectedHolding.payload.amount,
        frozen: selectedHolding.payload.frozen,
        reason: freezeReason,
      });

      const result = await ledger.exercise(ComplianceOfficer.FreezeAccount, complianceOfficer.contractId, {
        holdingCid: selectedHolding.contractId,
        reason: freezeReason,
      });

      console.log('Freeze result:', result);
      
      showSuccess(`Account frozen for ${getDisplayName(selectedHolding.payload.owner)}`);
      setFreezeModalOpen(false);
      setSelectedHolding(null);
      setFreezeReason('');
    } catch (error) {
      console.error('Freeze error:', error);
      showError('Failed to freeze account', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!selectedHolding) return;

    if (!complianceOfficer) {
      showError('Compliance officer contract not found', 'Cannot perform unfreeze operation');
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.exercise(ComplianceOfficer.UnfreezeAccount, complianceOfficer.contractId, {
        holdingCid: selectedHolding.contractId,
      });
      showSuccess(`Account unfrozen for ${getDisplayName(selectedHolding.payload.owner)}`);
      setUnfreezeModalOpen(false);
      setSelectedHolding(null);
    } catch (error) {
      showError('Failed to unfreeze account', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openFreezeModal = (holding: any) => {
    setSelectedHolding(holding);
    setFreezeReason('');
    setFreezeModalOpen(true);
  };

  const openUnfreezeModal = (holding: any) => {
    setSelectedHolding(holding);
    setUnfreezeModalOpen(true);
  };

  if (!isBank) {
    return (
      <Container style={{ marginTop: '2em' }}>
        <Message warning>
          <Message.Header>Access Denied</Message.Header>
          <p>This page is only accessible to Bank administrators.</p>
        </Message>
      </Container>
    );
  }

  if (holdingsLoading || complianceLoading) {
    return (
      <Dimmer active inverted>
        <Loader size='large'>Loading compliance data...</Loader>
      </Dimmer>
    );
  }

  if (!complianceOfficer) {
    return (
      <Container style={{ marginTop: '2em' }}>
        <Message error>
          <Message.Header>Compliance Officer Not Found</Message.Header>
          <p>No compliance officer contract found for your account. Please contact system administrator.</p>
        </Message>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='shield' />
              Compliance Management
            </Header>

            {/* Statistics */}
            <Segment>
              <Grid columns={3} divided textAlign='center'>
                <Grid.Row>
                  <Grid.Column>
                    <Header as='h2' color='green'>
                      {activeHoldings.length}
                      <Header.Subheader>Active Accounts</Header.Subheader>
                    </Header>
                  </Grid.Column>
                  <Grid.Column>
                    <Header as='h2' color='red'>
                      {frozenHoldings.length}
                      <Header.Subheader>Frozen Accounts</Header.Subheader>
                    </Header>
                  </Grid.Column>
                  <Grid.Column>
                    <Header as='h2' color='blue'>
                      {allHoldings.length}
                      <Header.Subheader>Total Accounts</Header.Subheader>
                    </Header>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>

            {/* Active Holdings */}
            <Segment>
              <Header as='h2'>
                <Icon name='check circle' color='green' />
                <Header.Content>
                  Active Holdings
                  <Header.Subheader>Accounts that can transact freely</Header.Subheader>
                </Header.Content>
              </Header>

              {activeHoldings.length === 0 ? (
                <Message info>No active holdings</Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Owner</Table.HeaderCell>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Status</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {activeHoldings.map(holding => (
                      <Table.Row key={holding.contractId}>
                        <Table.Cell>
                          <Icon name='user' />
                          {getDisplayName(holding.payload.owner)}
                        </Table.Cell>
                        <Table.Cell>
                          <strong>${parseFloat(holding.payload.amount).toFixed(2)}</strong>
                        </Table.Cell>
                        <Table.Cell>
                          <Label>{holding.payload.currency}</Label>
                        </Table.Cell>
                        <Table.Cell>
                          <Label color='green'>
                            <Icon name='unlock' />
                            Active
                          </Label>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='red'
                            onClick={() => openFreezeModal(holding)}
                            disabled={isProcessing}
                          >
                            <Icon name='lock' />
                            Freeze
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Segment>

            {/* Frozen Holdings */}
            <Segment>
              <Header as='h2'>
                <Icon name='ban' color='red' />
                <Header.Content>
                  Frozen Holdings
                  <Header.Subheader>Accounts with restricted access</Header.Subheader>
                </Header.Content>
              </Header>

              {frozenHoldings.length === 0 ? (
                <Message positive>
                  <Message.Header>No Frozen Accounts</Message.Header>
                  <p>All accounts are currently active.</p>
                </Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Owner</Table.HeaderCell>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Status</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {frozenHoldings.map(holding => (
                      <Table.Row key={holding.contractId} warning>
                        <Table.Cell>
                          <Icon name='user' />
                          {getDisplayName(holding.payload.owner)}
                        </Table.Cell>
                        <Table.Cell>
                          <strong>${parseFloat(holding.payload.amount).toFixed(2)}</strong>
                        </Table.Cell>
                        <Table.Cell>
                          <Label>{holding.payload.currency}</Label>
                        </Table.Cell>
                        <Table.Cell>
                          <Label color='red'>
                            <Icon name='lock' />
                            Frozen
                          </Label>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='green'
                            onClick={() => openUnfreezeModal(holding)}
                            disabled={isProcessing}
                          >
                            <Icon name='unlock' />
                            Unfreeze
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Freeze Modal */}
      <Modal open={freezeModalOpen} onClose={() => setFreezeModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='lock' color='red' />
          Freeze Account
        </Modal.Header>
        <Modal.Content>
          <Message warning>
            <Message.Header>Compliance Action</Message.Header>
            <p>
              Freezing this account will prevent the owner from transferring or redeeming stablecoins.
              The holding will remain visible but locked.
            </p>
          </Message>
          {selectedHolding && (
            <Segment>
              <Header as='h4'>Account Details</Header>
              <p><strong>Owner:</strong> {getDisplayName(selectedHolding.payload.owner)}</p>
              <p><strong>Amount:</strong> ${parseFloat(selectedHolding.payload.amount).toFixed(2)} {selectedHolding.payload.currency}</p>
            </Segment>
          )}
          <Form>
            <Form.Field required>
              <label>Reason for Freezing</label>
              <Input
                placeholder='e.g., Suspicious activity, AML investigation, Court order...'
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setFreezeModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='red'
            disabled={!freezeReason.trim() || isProcessing}
            loading={isProcessing}
            onClick={handleFreeze}
          >
            <Icon name='lock' />
            Freeze Account
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Unfreeze Modal */}
      <Modal open={unfreezeModalOpen} onClose={() => setUnfreezeModalOpen(false)} size='small'>
        <Modal.Header>
          <Icon name='unlock' color='green' />
          Unfreeze Account
        </Modal.Header>
        <Modal.Content>
          <Message positive>
            <Message.Header>Restore Account Access</Message.Header>
            <p>
              Unfreezing this account will restore full transaction capabilities to the owner.
            </p>
          </Message>
          {selectedHolding && (
            <Segment>
              <Header as='h4'>Account Details</Header>
              <p><strong>Owner:</strong> {getDisplayName(selectedHolding.payload.owner)}</p>
              <p><strong>Amount:</strong> ${parseFloat(selectedHolding.payload.amount).toFixed(2)} {selectedHolding.payload.currency}</p>
            </Segment>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setUnfreezeModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={isProcessing}
            loading={isProcessing}
            onClick={handleUnfreeze}
          >
            <Icon name='unlock' />
            Unfreeze Account
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default ComplianceManagement;