import React, { useState } from 'react';
import { useStreamQueries, useLedger, useParty } from '@daml/react';
import { Container, Grid, Header, Segment, Card, Button, Icon, Message } from 'semantic-ui-react';
import { TransferProposal } from '../daml.js/bank-stablecoin-1.0.0/lib/Model/Stablecoin';

const TransferProposals: React.FC = () => {
  const party = useParty();
  const ledger = useLedger();
  const { contracts: allProposals, loading } = useStreamQueries(TransferProposal);

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter proposals where current user is the new owner (incoming)
  const incomingProposals = allProposals.filter(p => p.payload.newOwner === party);
  
  // Filter proposals where current user is the sender (outgoing)
  const outgoingProposals = allProposals.filter(p => p.payload.coin.owner === party);

  const handleAccept = async (contractId: any) => {
    setProcessingId(contractId);
    try {
      await ledger.exercise(TransferProposal.AcceptTransfer, contractId, {});
      // Success - the contract will automatically disappear from the list
    } catch (error) {
      alert(`Failed to accept transfer:\n${JSON.stringify(error)}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (contractId: any) => {
    setProcessingId(contractId);
    try {
      await ledger.exercise(TransferProposal.RejectTransfer, contractId, {});
      // Success - the contract will automatically disappear from the list
    } catch (error) {
      alert(`Failed to reject transfer:\n${JSON.stringify(error)}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (contractId: any) => {
    setProcessingId(contractId);
    try {
      await ledger.exercise(TransferProposal.CancelTransfer, contractId, {});
      // Success - the contract will automatically disappear from the list
    } catch (error) {
      alert(`Failed to cancel transfer:\n${JSON.stringify(error)}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <h1>Loading proposals...</h1>;
  }

  return (
    <Container style={{ marginTop: '2em' }}>
      <Grid centered columns={1}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{ padding: '1ex 0em 0ex 0em' }}>
              Transfer Proposals
            </Header>

            {/* Incoming Proposals Section */}
            <Segment>
              <Header as='h2'>
                <Icon name='inbox' />
                <Header.Content>
                  Incoming Proposals
                  <Header.Subheader>Transfers waiting for your approval</Header.Subheader>
                </Header.Content>
              </Header>

              {incomingProposals.length === 0 ? (
                <Message info>
                  <Message.Header>No incoming proposals</Message.Header>
                  <p>You don't have any pending transfer proposals to review.</p>
                </Message>
              ) : (
                <Card.Group>
                  {incomingProposals.map((proposal) => (
                    <Card key={proposal.contractId} fluid color='green'>
                      <Card.Content>
                        <Card.Header>
                          ${parseFloat(proposal.payload.coin.amount).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} {proposal.payload.coin.currency}
                        </Card.Header>
                        <Card.Meta>
                          <div>From: {proposal.payload.coin.owner}</div>
                          <div>Issuer: {proposal.payload.coin.issuer}</div>
                        </Card.Meta>
                        <Card.Description style={{ marginTop: '0.5em' }}>
                          <Icon name='arrow right' color='green' />
                          This stablecoin is being transferred to you
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        <Button.Group fluid>
                          <Button
                            positive
                            disabled={processingId === proposal.contractId}
                            loading={processingId === proposal.contractId}
                            onClick={() => handleAccept(proposal.contractId)}
                          >
                            <Icon name='check' />
                            Accept
                          </Button>
                          <Button
                            negative
                            disabled={processingId === proposal.contractId}
                            onClick={() => handleReject(proposal.contractId)}
                          >
                            <Icon name='close' />
                            Reject
                          </Button>
                        </Button.Group>
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Group>
              )}
            </Segment>

            {/* Outgoing Proposals Section */}
            <Segment>
              <Header as='h2'>
                <Icon name='paper plane' />
                <Header.Content>
                  Outgoing Proposals
                  <Header.Subheader>Transfers waiting for recipient approval</Header.Subheader>
                </Header.Content>
              </Header>

              {outgoingProposals.length === 0 ? (
                <Message info>
                  <Message.Header>No outgoing proposals</Message.Header>
                  <p>You don't have any pending transfers waiting for approval.</p>
                </Message>
              ) : (
                <Card.Group>
                  {outgoingProposals.map((proposal) => (
                    <Card key={proposal.contractId} fluid color='orange'>
                      <Card.Content>
                        <Card.Header>
                          ${parseFloat(proposal.payload.coin.amount).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} {proposal.payload.coin.currency}
                        </Card.Header>
                        <Card.Meta>
                          <div>To: {proposal.payload.newOwner}</div>
                          <div>Issuer: {proposal.payload.coin.issuer}</div>
                        </Card.Meta>
                        <Card.Description style={{ marginTop: '0.5em' }}>
                          <Icon name='clock outline' color='orange' />
                          Waiting for recipient to accept or reject
                        </Card.Description>
                      </Card.Content>
                      <Card.Content extra>
                        <Button
                          color='red'
                          fluid
                          disabled={processingId === proposal.contractId}
                          loading={processingId === proposal.contractId}
                          onClick={() => handleCancel(proposal.contractId)}
                        >
                          <Icon name='trash' />
                          Cancel Transfer
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
    </Container>
  );
};

export default TransferProposals;