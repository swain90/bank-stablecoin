import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Table, Message, Dimmer, Loader, Statistic, Label } from 'semantic-ui-react';
import { BankReserve, IssuanceRequest, RedemptionRequest } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';
import { getDisplayName, getAllParties } from '../config/parties';
import { showSuccess, showError, showWarning } from './Toast';

const BankAdmin: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: reserves, loading: reservesLoading } = useStreamQueries(BankReserve);
  const { contracts: issuanceRequests, loading: issuanceLoading } = useStreamQueries(IssuanceRequest);
  const { contracts: redemptionRequests, loading: redemptionLoading } = useStreamQueries(RedemptionRequest);
 
  const [isProcessing, setIsProcessing] = useState(false);

  const bankParty = getAllParties().find(p => p.role === 'Issuer')?.partyId || '';
  const isBank = party === bankParty;
  console.log('=== BANK ADMIN DEBUG ===');
  console.log('All issuance requests:', issuanceRequests);
  console.log('Number of requests:', issuanceRequests.length);
  console.log('Reserves:', reserves);
  console.log('Bank party:', bankParty);
  console.log('Current party:', party);
  console.log('Is Bank:', isBank);
  const handleApproveIssuance = async (request: any, reserveCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(IssuanceRequest.ApproveIssuance, request.contractId, {
        reserveCid: reserveCid as any,  // Add 'as any' here
      });
      showSuccess(`Approved issuance of $${parseFloat(request.payload.amount).toFixed(2)} to ${getDisplayName(request.payload.requester)}`);
    } catch (error) {
      showError('Failed to approve issuance', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectIssuance = async (contractId: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(IssuanceRequest.RejectIssuance, contractId, {});
      showSuccess('Issuance request rejected');
    } catch (error) {
      showError('Failed to reject request', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveRedemption = async (request: any, reserveCid: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(RedemptionRequest.ApproveRedemption, request.contractId, {
        reserveCid: reserveCid as any,  // Add 'as any' here
      });
      showSuccess(`Approved redemption of $${parseFloat(request.payload.holding.amount).toFixed(2)} from ${getDisplayName(request.payload.redeemer)}`);
    } catch (error) {
      showError('Failed to approve redemption', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRedemption = async (contractId: any) => {
    setIsProcessing(true);
    try {
      await ledger.exercise(RedemptionRequest.RejectRedemption, contractId, {});
      showSuccess('Redemption request rejected and stablecoin returned');
    } catch (error) {
      showError('Failed to reject request', error);
    } finally {
      setIsProcessing(false);
    }
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

  if (reservesLoading || issuanceLoading || redemptionLoading) {
    return (
      <Dimmer active inverted>
        <Loader size='large'>Loading bank data...</Loader>
      </Dimmer>
    );
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              <Icon name='university' />
              Bank Administration
            </Header>

            {/* Reserve Overview */}
            <Segment>
              <Header as='h2'>
                <Icon name='database' />
                <Header.Content>
                  Reserve Overview
                  <Header.Subheader>Total issued and redeemed stablecoins</Header.Subheader>
                </Header.Content>
              </Header>

              {reserves.length === 0 ? (
                <Message warning>
                  <Message.Header>No Reserves Found</Message.Header>
                  <p>No reserve contracts exist. Reserves are created automatically when issuing stablecoins.</p>
                </Message>
              ) : (
                <Statistic.Group widths='3'>
                  {reserves.map(reserve => {
                    const totalIssued = parseFloat(reserve.payload.totalIssued);
                    const totalRedeemed = parseFloat(reserve.payload.totalRedeemed);
                    const netCirculation = totalIssued - totalRedeemed;

                    return (
                      <React.Fragment key={reserve.contractId}>
                        <Statistic color='green'>
                          <Statistic.Value>
                            ${totalIssued.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Statistic.Value>
                          <Statistic.Label>Total Issued ({reserve.payload.currency})</Statistic.Label>
                        </Statistic>

                        <Statistic color='orange'>
                          <Statistic.Value>
                            ${totalRedeemed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Statistic.Value>
                          <Statistic.Label>Total Redeemed</Statistic.Label>
                        </Statistic>

                        <Statistic color='blue'>
                          <Statistic.Value>
                            ${netCirculation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Statistic.Value>
                          <Statistic.Label>Net Circulation</Statistic.Label>
                        </Statistic>
                      </React.Fragment>
                    );
                  })}
                </Statistic.Group>
              )}
            </Segment>

            {/* Pending Issuance Requests */}
            <Segment>
              <Header as='h2'>
                <Icon name='plus circle' color='green' />
                <Header.Content>
                  Pending Issuance Requests
                  <Header.Subheader>Users requesting to buy stablecoins</Header.Subheader>
                </Header.Content>
              </Header>

              {issuanceRequests.length === 0 ? (
                <Message info>No pending issuance requests</Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Requester</Table.HeaderCell>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Reason</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {issuanceRequests.map(request => {
                      const matchingReserve = reserves.find(r => r.payload.currency === request.payload.currency);
                      
                      return (
                        <Table.Row key={request.contractId}>
                          <Table.Cell>
                            <Icon name='user' />
                            {getDisplayName(request.payload.requester)}
                          </Table.Cell>
                          <Table.Cell>
                            <strong>${parseFloat(request.payload.amount).toFixed(2)}</strong>
                          </Table.Cell>
                          <Table.Cell>
                            <Label>{request.payload.currency}</Label>
                          </Table.Cell>
                          <Table.Cell>{request.payload.reason}</Table.Cell>
                          <Table.Cell>
                            <Button.Group size='small'>
                              <Button
                                positive
                                disabled={!matchingReserve || isProcessing}
                                loading={isProcessing}
                                onClick={() => matchingReserve && handleApproveIssuance(request, matchingReserve.contractId)}
                              >
                                <Icon name='check' />
                                Approve
                              </Button>
                              <Button
                                negative
                                disabled={isProcessing}
                                onClick={() => handleRejectIssuance(request.contractId)}
                              >
                                <Icon name='close' />
                                Reject
                              </Button>
                            </Button.Group>
                            {!matchingReserve && (
                              <Message warning size='tiny' style={{ marginTop: '0.5em' }}>
                                No reserve for {request.payload.currency}
                              </Message>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              )}
            </Segment>

            {/* Pending Redemption Requests */}
            <Segment>
              <Header as='h2'>
                <Icon name='minus circle' color='orange' />
                <Header.Content>
                  Pending Redemption Requests
                  <Header.Subheader>Users requesting to sell stablecoins</Header.Subheader>
                </Header.Content>
              </Header>

              {redemptionRequests.length === 0 ? (
                <Message info>No pending redemption requests</Message>
              ) : (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Redeemer</Table.HeaderCell>
                      <Table.HeaderCell>Amount</Table.HeaderCell>
                      <Table.HeaderCell>Currency</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {redemptionRequests.map(request => {
                      const matchingReserve = reserves.find(r => r.payload.currency === request.payload.holding.currency);
                      
                      return (
                        <Table.Row key={request.contractId}>
                          <Table.Cell>
                            <Icon name='user' />
                            {getDisplayName(request.payload.redeemer)}
                          </Table.Cell>
                          <Table.Cell>
                            <strong>${parseFloat(request.payload.holding.amount).toFixed(2)}</strong>
                          </Table.Cell>
                          <Table.Cell>
                            <Label>{request.payload.holding.currency}</Label>
                          </Table.Cell>
                          <Table.Cell>
                            <Button.Group size='small'>
                              <Button
                                positive
                                disabled={!matchingReserve || isProcessing}
                                loading={isProcessing}
                                onClick={() => matchingReserve && handleApproveRedemption(request, matchingReserve.contractId)}
                              >
                                <Icon name='check' />
                                Approve
                              </Button>
                              <Button
                                negative
                                disabled={isProcessing}
                                onClick={() => handleRejectRedemption(request.contractId)}
                              >
                                <Icon name='close' />
                                Reject
                              </Button>
                            </Button.Group>
                            {!matchingReserve && (
                              <Message warning size='tiny' style={{ marginTop: '0.5em' }}>
                                No reserve for {request.payload.holding.currency}
                              </Message>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
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

export default BankAdmin;