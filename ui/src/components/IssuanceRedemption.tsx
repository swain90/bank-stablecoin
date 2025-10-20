import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Form, Modal, Input, Message, Table, Dimmer, Loader } from 'semantic-ui-react';
import { StablecoinHolding, IssuanceRequest, RedemptionRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const IssuanceRedemption: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: holdings, loading: holdingsLoading } = useStreamQueries(StablecoinHolding);
  const { contracts: issuanceRequests, loading: issuanceLoading } = useStreamQueries(IssuanceRequest);
  const { contracts: redemptionRequests, loading: redemptionLoading } = useStreamQueries(RedemptionRequest);

  const [issuanceModalOpen, setIssuanceModalOpen] = useState(false);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [issuanceAmount, setIssuanceAmount] = useState('');
  const [issuanceCurrency, setIssuanceCurrency] = useState('USD');
  const [issuanceReason, setIssuanceReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';

  // Filter requests for current user
  const myIssuanceRequests = issuanceRequests.filter(r => r.payload.requester === party);
  const myRedemptionRequests = redemptionRequests.filter(r => r.payload.redeemer === party);

  const handleRequestIssuance = async () => {
    if (!issuanceAmount || parseFloat(issuanceAmount) <= 0) {
      showWarning('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await ledger.create(IssuanceRequest, {
        requester: party,
        bank: bankParty,
        amount: issuanceAmount,
        currency: issuanceCurrency,
        reason: issuanceReason || 'Stablecoin purchase request',
      });
      showSuccess(`Issuance request for $${parseFloat(issuanceAmount).toFixed(2)} ${issuanceCurrency} submitted to Bank`);
      setIssuanceModalOpen(false);
      setIssuanceAmount('');
      setIssuanceReason('');
    } catch (error) {
      showError('Failed to request issuance', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRedemption = async () => {
    if (!selectedHolding) return;

    setIsProcessing(true);
    try {
      await ledger.exercise(StablecoinHolding.RequestRedemption, selectedHolding.contractId, {});
      showSuccess(`Redemption request for $${parseFloat(selectedHolding.payload.amount).toFixed(2)} submitted to Bank`);
      setRedemptionModalOpen(false);
      setSelectedHolding(null);
    } catch (error) {
      showError('Failed to request redemption', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelIssuanceRequest = async (contractId: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(IssuanceRequest.CancelIssuanceRequest, contractId, {});
      showSuccess('Issuance request cancelled');
    } catch (error) {
      showError('Failed to cancel request', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRedemptionRequest = async (contractId: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(RedemptionRequest.CancelRedemptionRequest, contractId, {});
      showSuccess('Redemption request cancelled and stablecoin returned');
    } catch (error) {
      showError('Failed to cancel request', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (holdingsLoading || issuanceLoading || redemptionLoading) {
    return (
      <Dimmer active inverted>
        <Loader size='large'>Loading...</Loader>
      </Dimmer>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              Issuance & Redemption
            </Header>

            {/* Action Buttons */}
            <Segment>
              <Button.Group fluid size='large'>
                <Button
                  color='green'
                  onClick={() => setIssuanceModalOpen(true)}
                >
                  <Icon name='plus circle' />
                  Request Issuance (Buy Stablecoins)
                </Button>
                <Button
                  color='orange'
                  onClick={() => setRedemptionModalOpen(true)}
                  disabled={holdings.length === 0}
                >
                  <Icon name='minus circle' />
                  Request Redemption (Sell Stablecoins)
                </Button>
              </Button.Group>
            </Segment>

            {/* Pending Issuance Requests */}
            <Segment>
              <Header as='h2'>
                <Icon name='hourglass half' color='blue' />
                <Header.Content>
                  Pending Issuance Requests
                  <Header.Subheader>Waiting for Bank approval</Header.Subheader>
                </Header.Content>
              </Header>

              {myIssuanceRequests.length === 0 ? (
                <Message info>No pending issuance requests</Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Reason</Table.HeaderCell>
                      <Table.HeaderCell>Action</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {myIssuanceRequests.map(request => (
                      <Table.Row key={request.contractId}>
                        <Table.Cell>
                          <strong>${parseFloat(request.payload.amount).toFixed(2)}</strong>
                        </Table.Cell>
                        <Table.Cell>{request.payload.currency}</Table.Cell>
                        <Table.Cell>{request.payload.reason}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='red'
                            onClick={() => handleCancelIssuanceRequest(request.contractId)}
                            disabled={isProcessing}
                          >
                            Cancel
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Segment>

            {/* Pending Redemption Requests */}
            <Segment>
              <Header as='h2'>
                <Icon name='hourglass half' color='orange' />
                <Header.Content>
                  Pending Redemption Requests
                  <Header.Subheader>Waiting for Bank approval</Header.Subheader>
                </Header.Content>
              </Header>

              {myRedemptionRequests.length === 0 ? (
                <Message info>No pending redemption requests</Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Action</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {myRedemptionRequests.map(request => (
                      <Table.Row key={request.contractId}>
                        <Table.Cell>
                          <strong>${parseFloat(request.payload.holding.amount).toFixed(2)}</strong>
                        </Table.Cell>
                        <Table.Cell>{request.payload.holding.currency}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size='small'
                            color='red'
                            onClick={() => handleCancelRedemptionRequest(request.contractId)}
                            disabled={isProcessing}
                          >
                            Cancel
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

      {/* Issuance Request Modal */}
      <Modal open={issuanceModalOpen} onClose={() => setIssuanceModalOpen(false)} size='small'>
        <Modal.Header>Request Stablecoin Issuance</Modal.Header>
        <Modal.Content>
          <Message info>
            <Message.Header>Buy Stablecoins</Message.Header>
            <p>Submit a request to the Bank to purchase stablecoins. The Bank will review and approve your request.</p>
          </Message>
          <Form>
            <Form.Field>
              <label>Amount</label>
              <Input
                type='number'
                placeholder='Enter amount...'
                value={issuanceAmount}
                onChange={(e) => setIssuanceAmount(e.target.value)}
                step='0.01'
                min='0.01'
              />
            </Form.Field>
            <Form.Field>
              <label>Currency</label>
              <Input
                value={issuanceCurrency}
                onChange={(e) => setIssuanceCurrency(e.target.value)}
                placeholder='USD'
              />
            </Form.Field>
            <Form.Field>
              <label>Reason (Optional)</label>
              <Input
                placeholder='e.g., Initial purchase, top-up...'
                value={issuanceReason}
                onChange={(e) => setIssuanceReason(e.target.value)}
              />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setIssuanceModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='green'
            disabled={!issuanceAmount || parseFloat(issuanceAmount) <= 0 || isProcessing}
            loading={isProcessing}
            onClick={handleRequestIssuance}
          >
            <Icon name='check' />
            Submit Request
          </Button>
        </Modal.Actions>
      </Modal>

      {/* Redemption Modal */}
      <Modal open={redemptionModalOpen} onClose={() => setRedemptionModalOpen(false)} size='small'>
        <Modal.Header>Request Stablecoin Redemption</Modal.Header>
        <Modal.Content>
          <Message warning>
            <Message.Header>Sell Stablecoins</Message.Header>
            <p>Select a holding to redeem. Your stablecoins will be locked until the Bank processes your request.</p>
          </Message>
          <Header as='h4'>Select Holding to Redeem:</Header>
          <Card.Group>
            {holdings.map(holding => (
              <Card
                key={holding.contractId}
                fluid
                color={selectedHolding?.contractId === holding.contractId ? 'orange' : undefined}
                onClick={() => setSelectedHolding(holding)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Content>
                  <Card.Header>
                    {selectedHolding?.contractId === holding.contractId && <Icon name='check circle' color='orange' />}
                    ${parseFloat(holding.payload.amount).toFixed(2)} {holding.payload.currency}
                  </Card.Header>
                  <Card.Meta>Issuer: {getDisplayName(holding.payload.issuer)}</Card.Meta>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setRedemptionModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            color='orange'
            disabled={!selectedHolding || isProcessing}
            loading={isProcessing}
            onClick={handleRequestRedemption}
          >
            <Icon name='check' />
            Submit Redemption Request
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default IssuanceRedemption;