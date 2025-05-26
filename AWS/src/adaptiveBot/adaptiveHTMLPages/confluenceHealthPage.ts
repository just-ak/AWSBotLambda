export const confluenceHealthPage = `
<p>
<h1>AWS Health Event: {event_title}</h1>

<ac:structured-macro ac:name="info">
    <ac:rich-text-body>
        <p><strong>Current Status:</strong> <span style="color: #f79232; font-weight: bold;">{event_status}</span></p>
        <p><strong>Event Type:</strong> {event_type}</p>
        <p><strong>Event Time:</strong> {event_time}</p>
        <p><strong>Regions Affected:</strong> {affected_regions}</p>
        <p><strong>Services Affected:</strong> {affected_services}</p>
        <p><strong>AWS Health Event ARN:</strong> {event_arn}</p>
        <p><strong>Account ID:</strong> {account_id}</p>
    </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Event Summary</ac:parameter>
    <ac:rich-text-body>
        <p>{description}</p>
    </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Impact Assessment</ac:parameter>
    <ac:rich-text-body>
        <h3>Business Impact</h3>
        <p>{business_impact}</p>
        
        <h3>Technical Impact</h3>
        <p>{technical_impact}</p>
        
        <h3>User Impact</h3>
        <p>{user_impact}</p>
    </ac:rich-text-body>
</ac:structured-macro>
        
<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Architecture Decision Record (ADR)</ac:parameter>
    <ac:rich-text-body>
        <h3>1. Context</h3>
        <p>This ADR documents the architectural decision made in response to the AWS Health event described above.</p>
        <p>{adr_context}</p>
        
        <h3>2. Decision</h3>
        <p>{adr_decision}</p>
        
        <h3>3. Status</h3>
        <p>{adr_status}</p>
        
        <h3>4. Consequences</h3>
        <h4>Positive:</h4>
        <ul>
            <li>{positive_consequence_1}</li>
            <li>{positive_consequence_2}</li>
        </ul>
        
        <h4>Negative:</h4>
        <ul>
            <li>{negative_consequence_1}</li>
            <li>{negative_consequence_2}</li>
        </ul>
        
        <h3>5. Alternatives Considered</h3>
        <ac:structured-macro ac:name="table">
            <ac:parameter ac:name="tableType">wrapped</ac:parameter>
            <ac:rich-text-body>
                <table>
                    <tr>
                        <th>Alternative</th>
                        <th>Pros</th>
                        <th>Cons</th>
                        <th>Why Not Selected</th>
                    </tr>
                    <tr>
                        <td>{alternative_1}</td>
                        <td>{alternative_1_pros}</td>
                        <td>{alternative_1_cons}</td>
                        <td>{alternative_1_reason}</td>
                    </tr>
                    <tr>
                        <td>{alternative_2}</td>
                        <td>{alternative_2_pros}</td>
                        <td>{alternative_2_cons}</td>
                        <td>{alternative_2_reason}</td>
                    </tr>
                </table>
            </ac:rich-text-body>
        </ac:structured-macro>
        
        <h3>6. Compliance Requirements</h3>
        <p>{adr_compliance}</p>
        
        <h3>7. Implementation Plan</h3>
        <p>{adr_implementation}</p>
        
        <h3>8. Approvals</h3>
        <ac:structured-macro ac:name="table">
            <ac:parameter ac:name="tableType">wrapped</ac:parameter>
            <ac:rich-text-body>
                <table>
                    <tr>
                        <th>Role</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Comments</th>
                    </tr>
                    <tr>
                        <td>Solutions Architect</td>
                        <td>{sa_name}</td>
                        <td>{sa_date}</td>
                        <td>{sa_comments}</td>
                    </tr>
                    <tr>
                        <td>Security Lead</td>
                        <td>{security_name}</td>
                        <td>{security_date}</td>
                        <td>{security_comments}</td>
                    </tr>
                    <tr>
                        <td>Operations Lead</td>
                        <td>{ops_name}</td>
                        <td>{ops_date}</td>
                        <td>{ops_comments}</td>
                    </tr>
                </table>
            </ac:rich-text-body>
        </ac:structured-macro>
    </ac:rich-text-body>
</ac:structured-macro>
        
<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Response Plan</ac:parameter>
    <ac:rich-text-body>
        <h3>Immediate Actions</h3>
        <ul>
            <li>{immediate_action_1}</li>
            <li>{immediate_action_2}</li>
            <li>{immediate_action_3}</li>
        </ul>
        
        <h3>Long-term Mitigation Plan</h3>
        <p>{long_term_plan}</p>
        
        <h3>Rollback Plan</h3>
        <p>{rollback_plan}</p>
    </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Communication Plan</ac:parameter>
    <ac:rich-text-body>
        <ac:structured-macro ac:name="table">
            <ac:parameter ac:name="tableType">wrapped</ac:parameter>
            <ac:rich-text-body>
                <table>
                    <tr>
                        <th>Stakeholder Group</th>
                        <th>Communication Method</th>
                        <th>Frequency</th>
                        <th>Owner</th>
                    </tr>
                    <tr>
                        <td>Executive Leadership</td>
                        <td>{exec_comm_method}</td>
                        <td>{exec_comm_frequency}</td>
                        <td>{exec_comm_owner}</td>
                    </tr>
                    <tr>
                        <td>Technical Teams</td>
                        <td>{tech_comm_method}</td>
                        <td>{tech_comm_frequency}</td>
                        <td>{tech_comm_owner}</td>
                    </tr>
                    <tr>
                        <td>End Users</td>
                        <td>{user_comm_method}</td>
                        <td>{user_comm_frequency}</td>
                        <td>{user_comm_owner}</td>
                    </tr>
                </table>
            </ac:rich-text-body>
        </ac:structured-macro>
    </ac:rich-text-body>
</ac:structured-macro>
        
<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Timeline & Updates</ac:parameter>
    <ac:rich-text-body>
        <ac:structured-macro ac:name="table">
            <ac:parameter ac:name="tableType">wrapped</ac:parameter>
            <ac:rich-text-body>
                <table>
                    <tr>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Update Description</th>
                        <th>Updated By</th>
                    </tr>
                    <tr>
                        <td>{update_1_time}</td>
                        <td>{update_1_status}</td>
                        <td>{update_1_desc}</td>
                        <td>{update_1_by}</td>
                    </tr>
                    <tr>
                        <td>{update_2_time}</td>
                        <td>{update_2_status}</td>
                        <td>{update_2_desc}</td>
                        <td>{update_2_by}</td>
                    </tr>
                </table>
            </ac:rich-text-body>
        </ac:structured-macro>
    </ac:rich-text-body>
</ac:structured-macro>

<ac:structured-macro ac:name="panel">
    <ac:parameter ac:name="title">Related Resources</ac:parameter>
    <ac:rich-text-body>
        <ul>
            <li><a href="{aws_health_link}">AWS Health Dashboard Link</a></li>
            <li><a href="{incident_ticket_link}">Incident Ticket</a></li>
            <li><a href="{runbook_link}">Related Runbook</a></li>
            <li><a href="{architecture_diagram_link}">Architecture Diagram</a></li>
            <li><a href="{cloudwatch_dashboard}">CloudWatch Dashboard</a></li>
            <li><a href="{aws_documentation}">AWS Service Documentation</a></li>
        </ul>
    </ac:rich-text-body>
</ac:structured-macro>
</p>
`;