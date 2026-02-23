---
title: "Model Design View Map"
weight: 1
draft: false
---
This page list MBean folders and attributes that are available in WDT, and where they can be found in the Model Design View navigation.

### Index
- [AdminConsole](#adminconsole)
- [AllowList](#allowlist)
- [Application](#application)
  - [SubDeployment](#application--subdeployment)
- [Callout](#callout)
- [CdiContainer](#cdicontainer)
- [Cluster](#cluster)
  - [CoherenceTier](#cluster--coherencetier)
  - [DatabaseLessLeasingBasis](#cluster--databaselessleasingbasis)
  - [DynamicServers](#cluster--dynamicservers)
  - [JTACluster](#cluster--jtacluster)
    - [JtaRemoteDomain](#cluster--jtacluster--jtaremotedomain)
  - [OverloadProtection](#cluster--overloadprotection)
    - [ServerFailureTrigger](#cluster--overloadprotection--serverfailuretrigger)
  - [WeblogicPluginRouting](#cluster--weblogicpluginrouting)
- [CoherenceClusterSystemResource](#coherenceclustersystemresource)
  - [CoherenceCacheConfig](#coherenceclustersystemresource--coherencecacheconfig)
  - [CoherenceResource](#coherenceclustersystemresource--coherenceresource)
    - [CoherenceAddressProvider](#coherenceclustersystemresource--coherenceresource--coherenceaddressprovider)
      - [CoherenceSocketAddress](#coherenceclustersystemresource--coherenceresource--coherenceaddressprovider--coherencesocketaddress)
    - [CoherenceClusterParams](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams)
      - [CoherenceCache](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherencecache)
      - [CoherenceClusterWellKnownAddress](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherenceclusterwellknownaddress)
      - [CoherenceIdentityAsserter](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherenceidentityasserter)
        - [CoherenceInitParam](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherenceidentityasserter--coherenceinitparam)
      - [CoherenceKeystoreParams](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherencekeystoreparams)
      - [CoherenceService](#coherenceclustersystemresource--coherenceresource--coherenceclusterparams--coherenceservice)
    - [CoherenceFederationParams](#coherenceclustersystemresource--coherenceresource--coherencefederationparams)
    - [CoherenceLoggingParams](#coherenceclustersystemresource--coherenceresource--coherenceloggingparams)
    - [CoherencePersistenceParams](#coherenceclustersystemresource--coherenceresource--coherencepersistenceparams)
- [DbClientDataDirectory](#dbclientdatadirectory)
- [DomainInfo](#domaininfo)
- [EJBContainer](#ejbcontainer)
- [EmbeddedLDAP](#embeddedldap)
- [FileStore](#filestore)
- [ForeignJNDIProvider](#foreignjndiprovider)
  - [ForeignJNDILink](#foreignjndiprovider--foreignjndilink)
- [HealthScore](#healthscore)
- [JDBCStore](#jdbcstore)
- [JDBCSystemResource](#jdbcsystemresource)
  - [JdbcResource](#jdbcsystemresource--jdbcresource)
    - [JDBCConnectionPoolParams](#jdbcsystemresource--jdbcresource--jdbcconnectionpoolparams)
    - [JDBCDataSourceParams](#jdbcsystemresource--jdbcresource--jdbcdatasourceparams)
    - [JDBCDriverParams](#jdbcsystemresource--jdbcresource--jdbcdriverparams)
      - [Properties](#jdbcsystemresource--jdbcresource--jdbcdriverparams--properties)
    - [JDBCOracleParams](#jdbcsystemresource--jdbcresource--jdbcoracleparams)
    - [JDBCXAParams](#jdbcsystemresource--jdbcresource--jdbcxaparams)
- [JMSBridgeDestination](#jmsbridgedestination)
- [JMSServer](#jmsserver)
  - [JmsMessageLogFile](#jmsserver--jmsmessagelogfile)
- [JMSSystemResource](#jmssystemresource)
  - [JmsResource](#jmssystemresource--jmsresource)
    - [ConnectionFactory](#jmssystemresource--jmsresource--connectionfactory)
      - [ClientParams](#jmssystemresource--jmsresource--connectionfactory--clientparams)
      - [DefaultDeliveryParams](#jmssystemresource--jmsresource--connectionfactory--defaultdeliveryparams)
      - [FlowControlParams](#jmssystemresource--jmsresource--connectionfactory--flowcontrolparams)
      - [LoadBalancingParams](#jmssystemresource--jmsresource--connectionfactory--loadbalancingparams)
      - [SecurityParams](#jmssystemresource--jmsresource--connectionfactory--securityparams)
      - [TransactionParams](#jmssystemresource--jmsresource--connectionfactory--transactionparams)
    - [DestinationKey](#jmssystemresource--jmsresource--destinationkey)
    - [ForeignServer](#jmssystemresource--jmsresource--foreignserver)
      - [ForeignConnectionFactory](#jmssystemresource--jmsresource--foreignserver--foreignconnectionfactory)
      - [ForeignDestination](#jmssystemresource--jmsresource--foreignserver--foreigndestination)
      - [JNDIProperty](#jmssystemresource--jmsresource--foreignserver--jndiproperty)
    - [Queue](#jmssystemresource--jmsresource--queue)
      - [DeliveryFailureParams](#jmssystemresource--jmsresource--queue--deliveryfailureparams)
      - [DeliveryParamsOverrides](#jmssystemresource--jmsresource--queue--deliveryparamsoverrides)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--queue--messageloggingparams)
      - [Thresholds](#jmssystemresource--jmsresource--queue--thresholds)
    - [Quota](#jmssystemresource--jmsresource--quota)
    - [SAFErrorHandling](#jmssystemresource--jmsresource--saferrorhandling)
    - [SAFImportedDestinations](#jmssystemresource--jmsresource--safimporteddestinations)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--safimporteddestinations--messageloggingparams)
      - [SAFQueue](#jmssystemresource--jmsresource--safimporteddestinations--safqueue)
        - [MessageLoggingParams](#jmssystemresource--jmsresource--safimporteddestinations--safqueue--messageloggingparams)
      - [SAFTopic](#jmssystemresource--jmsresource--safimporteddestinations--saftopic)
        - [MessageLoggingParams](#jmssystemresource--jmsresource--safimporteddestinations--saftopic--messageloggingparams)
    - [SAFRemoteContext](#jmssystemresource--jmsresource--safremotecontext)
      - [SAFLoginContext](#jmssystemresource--jmsresource--safremotecontext--saflogincontext)
    - [Template](#jmssystemresource--jmsresource--template)
      - [DeliveryFailureParams](#jmssystemresource--jmsresource--template--deliveryfailureparams)
      - [DeliveryParamsOverrides](#jmssystemresource--jmsresource--template--deliveryparamsoverrides)
      - [GroupParams](#jmssystemresource--jmsresource--template--groupparams)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--template--messageloggingparams)
      - [Multicast](#jmssystemresource--jmsresource--template--multicast)
      - [Thresholds](#jmssystemresource--jmsresource--template--thresholds)
      - [TopicSubscriptionParams](#jmssystemresource--jmsresource--template--topicsubscriptionparams)
    - [Topic](#jmssystemresource--jmsresource--topic)
      - [DeliveryFailureParams](#jmssystemresource--jmsresource--topic--deliveryfailureparams)
      - [DeliveryParamsOverrides](#jmssystemresource--jmsresource--topic--deliveryparamsoverrides)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--topic--messageloggingparams)
      - [Multicast](#jmssystemresource--jmsresource--topic--multicast)
      - [Thresholds](#jmssystemresource--jmsresource--topic--thresholds)
      - [TopicSubscriptionParams](#jmssystemresource--jmsresource--topic--topicsubscriptionparams)
    - [UniformDistributedQueue](#jmssystemresource--jmsresource--uniformdistributedqueue)
      - [DeliveryFailureParams](#jmssystemresource--jmsresource--uniformdistributedqueue--deliveryfailureparams)
      - [DeliveryParamsOverrides](#jmssystemresource--jmsresource--uniformdistributedqueue--deliveryparamsoverrides)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--uniformdistributedqueue--messageloggingparams)
      - [Thresholds](#jmssystemresource--jmsresource--uniformdistributedqueue--thresholds)
    - [UniformDistributedTopic](#jmssystemresource--jmsresource--uniformdistributedtopic)
      - [DeliveryFailureParams](#jmssystemresource--jmsresource--uniformdistributedtopic--deliveryfailureparams)
      - [DeliveryParamsOverrides](#jmssystemresource--jmsresource--uniformdistributedtopic--deliveryparamsoverrides)
      - [MessageLoggingParams](#jmssystemresource--jmsresource--uniformdistributedtopic--messageloggingparams)
      - [Multicast](#jmssystemresource--jmsresource--uniformdistributedtopic--multicast)
      - [Thresholds](#jmssystemresource--jmsresource--uniformdistributedtopic--thresholds)
      - [TopicSubscriptionParams](#jmssystemresource--jmsresource--uniformdistributedtopic--topicsubscriptionparams)
  - [SubDeployment](#jmssystemresource--subdeployment)
- [JMX](#jmx)
- [JPA](#jpa)
- [JTA](#jta)
  - [JtaRemoteDomain](#jta--jtaremotedomain)
- [JoltConnectionPool](#joltconnectionpool)
- [Library](#library)
  - [SubDeployment](#library--subdeployment)
- [Log](#log)
- [LogFilter](#logfilter)
- [Machine](#machine)
  - [NodeManager](#machine--nodemanager)
- [MailSession](#mailsession)
- [ManagedExecutorServiceTemplate](#managedexecutorservicetemplate)
- [ManagedScheduledExecutorServiceTemplate](#managedscheduledexecutorservicetemplate)
- [ManagedThreadFactoryTemplate](#managedthreadfactorytemplate)
- [MessagingBridge](#messagingbridge)
- [MigratableTarget](#migratabletarget)
- [NMProperties](#nmproperties)
- [ODLConfiguration](#odlconfiguration)
  - [Handler](#odlconfiguration--handler)
  - [Logger](#odlconfiguration--logger)
- [OHS](#ohs)
- [OPSSInitialization](#opssinitialization)
  - [Credential](#opssinitialization--credential)
    - [TargetKey](#opssinitialization--credential--targetkey)
- [PathService](#pathservice)
- [PluginDeployment](#plugindeployment)
- [RCUDbInfo](#rcudbinfo)
- [RemoteConsoleHelper](#remoteconsolehelper)
- [RestfulManagementServices](#restfulmanagementservices)
- [RmiForwarding](#rmiforwarding)
  - [ConfigurationProperty](#rmiforwarding--configurationproperty)
- [SAFAgent](#safagent)
  - [JmssafMessageLogFile](#safagent--jmssafmessagelogfile)
- [SNMPAgent](#snmpagent)
  - [SNMPAttributeChange](#snmpagent--snmpattributechange)
  - [SNMPCounterMonitor](#snmpagent--snmpcountermonitor)
  - [SNMPGaugeMonitor](#snmpagent--snmpgaugemonitor)
  - [SNMPLogFilter](#snmpagent--snmplogfilter)
  - [SNMPProxy](#snmpagent--snmpproxy)
  - [SNMPStringMonitor](#snmpagent--snmpstringmonitor)
  - [SNMPTrapDestination](#snmpagent--snmptrapdestination)
- [SecurityConfiguration](#securityconfiguration)
  - [CertRevoc](#securityconfiguration--certrevoc)
    - [CertRevocCa](#securityconfiguration--certrevoc--certrevocca)
  - [CertificateManagement](#securityconfiguration--certificatemanagement)
    - [CertificateIssuerPlugin](#securityconfiguration--certificatemanagement--certificateissuerplugin)
    - [ConfigurationProperty](#securityconfiguration--certificatemanagement--configurationproperty)
  - [CredentialSet](#securityconfiguration--credentialset)
    - [EncryptedProperty](#securityconfiguration--credentialset--encryptedproperty)
  - [Realm](#securityconfiguration--realm)
    - [Adjudicator](#securityconfiguration--realm--adjudicator)
      - [DefaultAdjudicator](#securityconfiguration--realm--adjudicator--defaultadjudicator)
    - [Auditor](#securityconfiguration--realm--auditor)
      - [DefaultAuditor](#securityconfiguration--realm--auditor--defaultauditor)
    - [AuthenticationProvider](#securityconfiguration--realm--authenticationprovider)
      - [ActiveDirectoryAuthenticator](#securityconfiguration--realm--authenticationprovider--activedirectoryauthenticator)
      - [CustomDBMSAuthenticator](#securityconfiguration--realm--authenticationprovider--customdbmsauthenticator)
      - [DefaultAuthenticator](#securityconfiguration--realm--authenticationprovider--defaultauthenticator)
      - [DefaultIdentityAsserter](#securityconfiguration--realm--authenticationprovider--defaultidentityasserter)
      - [IPlanetAuthenticator](#securityconfiguration--realm--authenticationprovider--iplanetauthenticator)
      - [LDAPAuthenticator](#securityconfiguration--realm--authenticationprovider--ldapauthenticator)
      - [LDAPX509IdentityAsserter](#securityconfiguration--realm--authenticationprovider--ldapx509identityasserter)
      - [NegotiateIdentityAsserter](#securityconfiguration--realm--authenticationprovider--negotiateidentityasserter)
      - [NovellAuthenticator](#securityconfiguration--realm--authenticationprovider--novellauthenticator)
      - [OIDCIdentityAsserter](#securityconfiguration--realm--authenticationprovider--oidcidentityasserter)
      - [OpenLDAPAuthenticator](#securityconfiguration--realm--authenticationprovider--openldapauthenticator)
      - [OracleInternetDirectoryAuthenticator](#securityconfiguration--realm--authenticationprovider--oracleinternetdirectoryauthenticator)
      - [OracleUnifiedDirectoryAuthenticator](#securityconfiguration--realm--authenticationprovider--oracleunifieddirectoryauthenticator)
      - [OracleVirtualDirectoryAuthenticator](#securityconfiguration--realm--authenticationprovider--oraclevirtualdirectoryauthenticator)
      - [ReadOnlySQLAuthenticator](#securityconfiguration--realm--authenticationprovider--readonlysqlauthenticator)
      - [SAML2IdentityAsserter](#securityconfiguration--realm--authenticationprovider--saml2identityasserter)
      - [SAMLAuthenticator](#securityconfiguration--realm--authenticationprovider--samlauthenticator)
      - [SAMLIdentityAsserterV2](#securityconfiguration--realm--authenticationprovider--samlidentityasserterv2)
      - [SQLAuthenticator](#securityconfiguration--realm--authenticationprovider--sqlauthenticator)
      - [TrustServiceIdentityAsserter](#securityconfiguration--realm--authenticationprovider--trustserviceidentityasserter)
      - [VirtualUserAuthenticator](#securityconfiguration--realm--authenticationprovider--virtualuserauthenticator)
      - [weblogic.security.providers.authentication.OracleIdentityCloudIntegrator](#securityconfiguration--realm--authenticationprovider--weblogic.security.providers.authentication.oracleidentitycloudintegrator)
    - [Authorizer](#securityconfiguration--realm--authorizer)
      - [DefaultAuthorizer](#securityconfiguration--realm--authorizer--defaultauthorizer)
      - [XACMLAuthorizer](#securityconfiguration--realm--authorizer--xacmlauthorizer)
    - [CertPathProvider](#securityconfiguration--realm--certpathprovider)
      - [CertificateRegistry](#securityconfiguration--realm--certpathprovider--certificateregistry)
      - [WebLogicCertPathProvider](#securityconfiguration--realm--certpathprovider--weblogiccertpathprovider)
    - [CredentialMapper](#securityconfiguration--realm--credentialmapper)
      - [DefaultCredentialMapper](#securityconfiguration--realm--credentialmapper--defaultcredentialmapper)
      - [PKICredentialMapper](#securityconfiguration--realm--credentialmapper--pkicredentialmapper)
      - [SAML2CredentialMapper](#securityconfiguration--realm--credentialmapper--saml2credentialmapper)
      - [SAMLCredentialMapperV2](#securityconfiguration--realm--credentialmapper--samlcredentialmapperv2)
    - [PasswordValidator](#securityconfiguration--realm--passwordvalidator)
      - [SystemPasswordValidator](#securityconfiguration--realm--passwordvalidator--systempasswordvalidator)
    - [RDBMSSecurityStore](#securityconfiguration--realm--rdbmssecuritystore)
    - [RoleMapper](#securityconfiguration--realm--rolemapper)
      - [DefaultRoleMapper](#securityconfiguration--realm--rolemapper--defaultrolemapper)
      - [XACMLRoleMapper](#securityconfiguration--realm--rolemapper--xacmlrolemapper)
    - [UserLockoutManager](#securityconfiguration--realm--userlockoutmanager)
  - [SecureMode](#securityconfiguration--securemode)
- [SelfTuning](#selftuning)
  - [Capacity](#selftuning--capacity)
  - [ContextRequestClass](#selftuning--contextrequestclass)
    - [ContextCase](#selftuning--contextrequestclass--contextcase)
  - [FairShareRequestClass](#selftuning--fairsharerequestclass)
  - [MaxThreadsConstraint](#selftuning--maxthreadsconstraint)
  - [MinThreadsConstraint](#selftuning--minthreadsconstraint)
  - [ResponseTimeRequestClass](#selftuning--responsetimerequestclass)
  - [WorkManager](#selftuning--workmanager)
    - [WorkManagerShutdownTrigger](#selftuning--workmanager--workmanagershutdowntrigger)
- [Server](#server)
  - [COM](#server--com)
  - [CoherenceMemberConfig](#server--coherencememberconfig)
  - [ConfigurationProperty](#server--configurationproperty)
  - [DataSource](#server--datasource)
    - [DataSourceLogFile](#server--datasource--datasourcelogfile)
  - [DefaultFileStore](#server--defaultfilestore)
  - [ExecuteQueue](#server--executequeue)
  - [HealthScore](#server--healthscore)
  - [IIOP](#server--iiop)
  - [JTAMigratableTarget](#server--jtamigratabletarget)
  - [Log](#server--log)
  - [NetworkAccessPoint](#server--networkaccesspoint)
  - [OverloadProtection](#server--overloadprotection)
    - [ServerFailureTrigger](#server--overloadprotection--serverfailuretrigger)
  - [RmiForwarding](#server--rmiforwarding)
    - [ConfigurationProperty](#server--rmiforwarding--configurationproperty)
  - [SSL](#server--ssl)
  - [ServerDebug](#server--serverdebug)
    - [DebugScope](#server--serverdebug--debugscope)
  - [ServerDiagnosticConfig](#server--serverdiagnosticconfig)
    - [WldfBuiltinWatchConfiguration](#server--serverdiagnosticconfig--wldfbuiltinwatchconfiguration)
  - [ServerStart](#server--serverstart)
  - [SingleSignOnServices](#server--singlesignonservices)
  - [TransactionLogJDBCStore](#server--transactionlogjdbcstore)
  - [WebServer](#server--webserver)
    - [WebServerLog](#server--webserver--webserverlog)
  - [WebService](#server--webservice)
    - [WebServiceBuffering](#server--webservice--webservicebuffering)
      - [WebServiceRequestBufferingQueue](#server--webservice--webservicebuffering--webservicerequestbufferingqueue)
      - [WebServiceResponseBufferingQueue](#server--webservice--webservicebuffering--webserviceresponsebufferingqueue)
    - [WebServicePersistence](#server--webservice--webservicepersistence)
      - [WebServiceLogicalStore](#server--webservice--webservicepersistence--webservicelogicalstore)
      - [WebServicePhysicalStore](#server--webservice--webservicepersistence--webservicephysicalstore)
    - [WebServiceReliability](#server--webservice--webservicereliability)
    - [WebServiceResiliency](#server--webservice--webserviceresiliency)
- [ServerTemplate](#servertemplate)
  - [COM](#servertemplate--com)
  - [CoherenceMemberConfig](#servertemplate--coherencememberconfig)
  - [ConfigurationProperty](#servertemplate--configurationproperty)
  - [DataSource](#servertemplate--datasource)
    - [DataSourceLogFile](#servertemplate--datasource--datasourcelogfile)
  - [DefaultFileStore](#servertemplate--defaultfilestore)
  - [ExecuteQueue](#servertemplate--executequeue)
  - [HealthScore](#servertemplate--healthscore)
  - [IIOP](#servertemplate--iiop)
  - [JTAMigratableTarget](#servertemplate--jtamigratabletarget)
  - [Log](#servertemplate--log)
  - [NetworkAccessPoint](#servertemplate--networkaccesspoint)
  - [OverloadProtection](#servertemplate--overloadprotection)
    - [ServerFailureTrigger](#servertemplate--overloadprotection--serverfailuretrigger)
  - [RmiForwarding](#servertemplate--rmiforwarding)
    - [ConfigurationProperty](#servertemplate--rmiforwarding--configurationproperty)
  - [SSL](#servertemplate--ssl)
  - [ServerDebug](#servertemplate--serverdebug)
    - [DebugScope](#servertemplate--serverdebug--debugscope)
  - [ServerDiagnosticConfig](#servertemplate--serverdiagnosticconfig)
    - [WldfBuiltinWatchConfiguration](#servertemplate--serverdiagnosticconfig--wldfbuiltinwatchconfiguration)
  - [ServerStart](#servertemplate--serverstart)
  - [SingleSignOnServices](#servertemplate--singlesignonservices)
  - [TransactionLogJDBCStore](#servertemplate--transactionlogjdbcstore)
  - [WebServer](#servertemplate--webserver)
    - [WebServerLog](#servertemplate--webserver--webserverlog)
  - [WebService](#servertemplate--webservice)
    - [WebServiceBuffering](#servertemplate--webservice--webservicebuffering)
      - [WebServiceRequestBufferingQueue](#servertemplate--webservice--webservicebuffering--webservicerequestbufferingqueue)
      - [WebServiceResponseBufferingQueue](#servertemplate--webservice--webservicebuffering--webserviceresponsebufferingqueue)
    - [WebServicePersistence](#servertemplate--webservice--webservicepersistence)
      - [WebServiceLogicalStore](#servertemplate--webservice--webservicepersistence--webservicelogicalstore)
      - [WebServicePhysicalStore](#servertemplate--webservice--webservicepersistence--webservicephysicalstore)
    - [WebServiceReliability](#servertemplate--webservice--webservicereliability)
    - [WebServiceResiliency](#servertemplate--webservice--webserviceresiliency)
- [ShutdownClass](#shutdownclass)
- [SingletonService](#singletonservice)
- [SnmpAgentDeployment](#snmpagentdeployment)
  - [SNMPAttributeChange](#snmpagentdeployment--snmpattributechange)
  - [SNMPCounterMonitor](#snmpagentdeployment--snmpcountermonitor)
  - [SNMPGaugeMonitor](#snmpagentdeployment--snmpgaugemonitor)
  - [SNMPLogFilter](#snmpagentdeployment--snmplogfilter)
  - [SNMPProxy](#snmpagentdeployment--snmpproxy)
  - [SNMPStringMonitor](#snmpagentdeployment--snmpstringmonitor)
  - [SNMPTrapDestination](#snmpagentdeployment--snmptrapdestination)
- [StartupClass](#startupclass)
- [SystemComponent](#systemcomponent)
  - [SystemComponentStart](#systemcomponent--systemcomponentstart)
- [Topology](#topology)
- [UnixMachine](#unixmachine)
  - [NodeManager](#unixmachine--nodemanager)
- [VirtualHost](#virtualhost)
  - [WebServerLog](#virtualhost--webserverlog)
- [WLDFSystemResource](#wldfsystemresource)
  - [WLDFResource](#wldfsystemresource--wldfresource)
    - [Harvester](#wldfsystemresource--wldfresource--harvester)
      - [HarvestedType](#wldfsystemresource--wldfresource--harvester--harvestedtype)
    - [Instrumentation](#wldfsystemresource--wldfresource--instrumentation)
      - [WLDFInstrumentationMonitor](#wldfsystemresource--wldfresource--instrumentation--wldfinstrumentationmonitor)
    - [WatchNotification](#wldfsystemresource--wldfresource--watchnotification)
      - [HeapDumpAction](#wldfsystemresource--wldfresource--watchnotification--heapdumpaction)
      - [ImageNotification](#wldfsystemresource--wldfresource--watchnotification--imagenotification)
      - [JMSNotification](#wldfsystemresource--wldfresource--watchnotification--jmsnotification)
      - [JMXNotification](#wldfsystemresource--wldfresource--watchnotification--jmxnotification)
      - [LogAction](#wldfsystemresource--wldfresource--watchnotification--logaction)
      - [RestNotification](#wldfsystemresource--wldfresource--watchnotification--restnotification)
      - [SMTPNotification](#wldfsystemresource--wldfresource--watchnotification--smtpnotification)
      - [SNMPNotification](#wldfsystemresource--wldfresource--watchnotification--snmpnotification)
      - [ScaleDownAction](#wldfsystemresource--wldfresource--watchnotification--scaledownaction)
      - [ScaleUpAction](#wldfsystemresource--wldfresource--watchnotification--scaleupaction)
      - [ScriptAction](#wldfsystemresource--wldfresource--watchnotification--scriptaction)
      - [ThreadDumpAction](#wldfsystemresource--wldfresource--watchnotification--threaddumpaction)
      - [Watch](#wldfsystemresource--wldfresource--watchnotification--watch)
        - [Schedule](#wldfsystemresource--wldfresource--watchnotification--watch--schedule)
- [WLSPolicies](#wlspolicies)
- [WLSRoles](#wlsroles)
- [WLSUserPasswordCredentialMappings](#wlsuserpasswordcredentialmappings)
  - [CrossDomain](#wlsuserpasswordcredentialmappings--crossdomain)
  - [RemoteResource](#wlsuserpasswordcredentialmappings--remoteresource)
- [WSReliableDeliveryPolicy](#wsreliabledeliverypolicy)
- [WTCServer](#wtcserver)
  - [WTCExport](#wtcserver--wtcexport)
  - [WTCImport](#wtcserver--wtcimport)
  - [WTCLocalTuxDom](#wtcserver--wtclocaltuxdom)
  - [WTCPassword](#wtcserver--wtcpassword)
  - [WTCRemoteTuxDom](#wtcserver--wtcremotetuxdom)
  - [WTCResources](#wtcserver--wtcresources)
  - [WTCtBridgeGlobal](#wtcserver--wtctbridgeglobal)
  - [WTCtBridgeRedirect](#wtcserver--wtctbridgeredirect)
- [WebAppContainer](#webappcontainer)
  - [GzipCompression](#webappcontainer--gzipcompression)
  - [Http2Config](#webappcontainer--http2config)
- [WebserviceSecurity](#webservicesecurity)
  - [WebserviceCredentialProvider](#webservicesecurity--webservicecredentialprovider)
    - [ConfigurationProperty](#webservicesecurity--webservicecredentialprovider--configurationproperty)
  - [WebserviceSecurityToken](#webservicesecurity--webservicesecuritytoken)
    - [ConfigurationProperty](#webservicesecurity--webservicesecuritytoken--configurationproperty)
  - [WebserviceTimestamp](#webservicesecurity--webservicetimestamp)
  - [WebserviceTokenHandler](#webservicesecurity--webservicetokenhandler)
    - [ConfigurationProperty](#webservicesecurity--webservicetokenhandler--configurationproperty)
- [XMLEntityCache](#xmlentitycache)
- [XMLRegistry](#xmlregistry)
  - [XMLEntitySpecRegistryEntry](#xmlregistry--xmlentityspecregistryentry)
  - [XMLParserSelectRegistryEntry](#xmlregistry--xmlparserselectregistryentry)

### AdminConsole
Navigate to: Topology => Admin Console

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cookie Name | CookieName |  |
|Min Threads | MinThreads |  |
|Notes | Notes |  |
|Protected Cookie Enabled | ProtectedCookieEnabled |  |
|SSO Logout URL | SsoLogoutUrl |  |
|Session Timeout | SessionTimeout |  |

### AllowList
Navigate to: Topology => Allow List

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allow List Recording Enabled | AllowListRecordingEnabled |  |
|Allow List Violation Action | AllowListViolationAction |  |
|Coherence Classes Always Block | CoherenceClassesAlwaysBlock |  |
|Notes | Notes |  |
|Serial Properties File Polling Interval | SerialPropFilePollingInterval |  |
|Synthesize Allow List Enabled | SynthesizeAllowListEnabled |  |

### Application
Navigate to: Deployments => Applications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Alternative Descriptor Path | AltDescriptorPath | "Advanced" collapsible => "Alternate Descriptor Paths" section |
|Alternative WLS Descriptor Path | AltWLSDescriptorPath | "Advanced" collapsible => "Alternate Descriptor Paths" section |
|Cache In App Directory | CacheInAppDirectory | "Advanced" collapsible => "Application Attributes" section |
|Compatibility Name | CompatibilityName | "Advanced" collapsible => "Application Attributes" section |
|Deployment Order | DeploymentOrder |  |
|Deployment Principal Name | DeploymentPrincipalName |  |
|Install Directory | InstallDir | "Advanced" collapsible => "Application Attributes" section |
|Module Type | ModuleType |  |
|Multi Version App | MultiVersionApp | "Advanced" collapsible => "Application Attributes" section |
|Notes | Notes |  |
|Parallel Deploy Modules | ParallelDeployModules | "Advanced" collapsible => "Application Attributes" section |
|Plan Directory | PlanDir |  |
|Plan Path | PlanPath |  |
|Plan Staging Mode | PlanStagingMode |  |
|Security Deployment Descriptor Model | SecurityDDModel |  |
|Source Path | SourcePath |  |
|Staging Mode | StagingMode |  |
|Targets | Target |  |

### Application / SubDeployment
Navigate to: Deployments => Applications => (instance) => SubDeployments => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName |  |
|Module Type | ModuleType |  |
|Notes | Notes |  |
|Targets | Target |  |

### Callout
Navigate to: Topology => Callouts => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Argument | Argument |  |
|Class Name | ClassName |  |
|Hook Point | HookPoint |  |
|Notes | Notes |  |

### CdiContainer
Navigate to: Topology => CDI Container

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Implicit Bean Discovery Enabled | ImplicitBeanDiscoveryEnabled |  |
|Notes | Notes |  |
|Policy | Policy |  |

### Cluster
Navigate to: Topology => Clusters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Additional Auto Migration Attempts | AdditionalAutoMigrationAttempts | "Migration" tab |
|Async Session Queue Timeout | AsyncSessionQueueTimeout | "Replication" tab => "Advanced" collapsible |
|Auto Migration Table Name | AutoMigrationTableName | "Migration" tab |
|Auto Migration Table Creation DDL File | AutoMigrationTableCreationDdlFile | "Migration" tab |
|Auto Migration Table Creation Policy | AutoMigrationTableCreationPolicy | "Migration" tab |
|Candidate Machines for Migratable Server | CandidateMachinesForMigratableServer | "Migration" tab |
|Client Certificate Proxy Enabled | ClientCertProxyEnabled | "General" tab => "Advanced" collapsible |
|Cluster Address | ClusterAddress | "General" tab |
|Cluster Broadcast Channel | ClusterBroadcastChannel | "Messaging" tab |
|Cluster Messaging Mode | ClusterMessagingMode | "Messaging" tab |
|Cluster Type | ClusterType | "Replication" tab |
|Coherence Cluster System Resource | CoherenceClusterSystemResource | "Coherence" tab |
|Concurrent Singleton Activation Enabled | ConcurrentSingletonActivationEnabled | "General" tab |
|Consensus Participants | ConsensusParticipants | "Migration" tab |
|Data Source For Automatic Migration | DataSourceForAutomaticMigration | "Migration" tab |
|Data Source For Job Scheduler | DataSourceForJobScheduler | "Scheduling" tab |
|Data Source For Session Persistence | DataSourceForSessionPersistence | "Replication" tab |
|Database Leasing Basis Connection Retry Count | DatabaseLeasingBasisConnectionRetryCount | "Migration" tab |
|Database Leasing Basis Connection Retry Delay | DatabaseLeasingBasisConnectionRetryDelay | "Migration" tab |
|Death Detector Heartbeat Period | DeathDetectorHeartbeatPeriod | "Messaging" tab => "Advanced" collapsible |
|Default Load Algorithm | DefaultLoadAlgorithm | "General" tab |
|Fencing Grace Period Millis | FencingGracePeriodMillis | "Health" tab |
|Frontend HTTP Port | FrontendHTTPPort | "HTTP" tab |
|Frontend HTTPS Port | FrontendHTTPSPort | "HTTP" tab |
|Frontend Host | FrontendHost | "HTTP" tab |
|Greedy Session Flush Interval | GreedySessionFlushInterval | "Replication" tab => "Advanced" collapsible |
|Health Check Interval Millis | HealthCheckIntervalMillis | "Health" tab |
|Health Check Periods Until Fencing | HealthCheckPeriodsUntilFencing | "Health" tab |
|HTTP Ping Retry Count | HttpPingRetryCount | "Health" tab |
|HTTP Trace Support Enabled | HttpTraceSupportEnabled | "HTTP" tab |
|Idle Periods Until Timeout | IdlePeriodsUntilTimeout | "Messaging" tab => "Advanced" collapsible |
|Inter-Cluster Communication Link Health Check Interval | InterClusterCommLinkHealthCheckInterval | "Health" tab |
|Job Scheduler Table Name | JobSchedulerTableName | "Scheduling" tab |
|Max Secondary Selection Attempts | MaxSecondarySelectionAttempts | "Replication" tab => "Advanced" collapsible |
|Max Server Count For HTTP Ping | MaxServerCountForHttpPing | "Health" tab |
|Member Death Detector Enabled | MemberDeathDetectorEnabled | "Migration" tab |
|Member Warmup Timeout Seconds | MemberWarmupTimeoutSeconds | "Messaging" tab => "Advanced" collapsible |
|Message Ordering Enabled | MessageOrderingEnabled | "Messaging" tab => "Advanced" collapsible |
|Migration Basis | MigrationBasis | "Migration" tab |
|Milliseconds To Sleep Between Auto Migration Attempts | MillisToSleepBetweenAutoMigrationAttempts | "Migration" tab |
|Multicast Address | MulticastAddress | "Messaging" tab |
|Multicast Buffer Size | MulticastBufferSize | "Messaging" tab => "Advanced" collapsible |
|Multicast Data Encryption | MulticastDataEncryption | "Messaging" tab => "Advanced" collapsible |
|Multicast Port | MulticastPort | "Messaging" tab |
|Multicast Send Delay | MulticastSendDelay | "Messaging" tab => "Advanced" collapsible |
|Multicast Time-to-Live | MulticastTTL | "Messaging" tab => "Advanced" collapsible |
|Notes | Notes | "General" tab |
|Number Of Servers In Cluster Address | NumberOfServersInClusterAddress | "General" tab |
|One-Way RMI For Replication Enabled | OneWayRmiForReplicationEnabled | "Replication" tab => "Advanced" collapsible |
|Persist Sessions On Shutdown | PersistSessionsOnShutdown | "Replication" tab |
|Rebalance Delay Periods | RebalanceDelayPeriods | "Migration" tab |
|Remote Cluster Address | RemoteClusterAddress | "Replication" tab |
|Replication Channel | ReplicationChannel | "Replication" tab |
|Replication Timeout Enabled | ReplicationTimeoutEnabled | "Replication" tab => "Advanced" collapsible |
|Replication Timeout Milliseconds | ReplicationTimeoutMillis | "Replication" tab => "Advanced" collapsible |
|Secure Cluster Broadcast Enabled | SecureClusterBroadcastEnabled | "Messaging" tab |
|Secure Replication Enabled | SecureReplicationEnabled | "Replication" tab |
|Service Activation Request Response Timeout | ServiceActivationRequestResponseTimeout | "General" tab => "Advanced" collapsible |
|Service Age Threshold Seconds | ServiceAgeThresholdSeconds | "General" tab => "Advanced" collapsible |
|Session Flush Interval | SessionFlushInterval | "Replication" tab => "Advanced" collapsible |
|Session Flush Threshold | SessionFlushThreshold | "Replication" tab => "Advanced" collapsible |
|Session Lazy Deserialization Enabled | SessionLazyDeserializationEnabled | "Replication" tab => "Advanced" collapsible |
|Session State Query Protocol Enabled | SessionStateQueryProtocolEnabled | "Replication" tab => "Advanced" collapsible |
|Session State Query Request Timeout | SessionStateQueryRequestTimeout | "Replication" tab => "Advanced" collapsible |
|Singleton SQL Query Helper | SingletonSQLQueryHelper | "Migration" tab |
|Singleton Service Request Timeout | SingletonServiceRequestTimeout | "Messaging" tab => "Advanced" collapsible |
|Site Name | SiteName | "General" tab |
|Transaction Affinity Enabled | TxnAffinityEnabled | "General" tab |
|Unicast Discovery Period Milliseconds | UnicastDiscoveryPeriodMillis | "Messaging" tab => "Advanced" collapsible |
|Unicast Read Timeout | UnicastReadTimeout | "Messaging" tab => "Advanced" collapsible |
|WAN Session Persistence Table Name | WANSessionPersistenceTableName | "Replication" tab |
|WebLogic Plug-in Enabled | WeblogicPluginEnabled | "General" tab => "Advanced" collapsible |

### Cluster / CoherenceTier
Navigate to: Topology => Clusters => (instance) => Coherence Tier

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Coherence Web Federated Storage Enabled | CoherenceWebFederatedStorageEnabled |  |
|Coherence Web Local Storage Enabled | CoherenceWebLocalStorageEnabled |  |
|Local Storage Enabled | LocalStorageEnabled |  |
|Notes | Notes |  |

### Cluster / DatabaseLessLeasingBasis
Navigate to: Topology => Clusters => (instance) => Database Less Leasing Basis

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Fence Timeout | FenceTimeout | "Advanced" collapsible |
|Leader Heartbeat Period | LeaderHeartbeatPeriod | "Advanced" collapsible |
|Member Discovery Timeout | MemberDiscoveryTimeout |  |
|Message Delivery Timeout | MessageDeliveryTimeout | "Advanced" collapsible |
|Node Manager Timeout Milliseconds | NodeManagerTimeoutMillis | "Advanced" collapsible |
|Notes | Notes |  |
|Periodic SRM Check Enabled | PeriodicSrmCheckEnabled | "Advanced" collapsible |

### Cluster / DynamicServers
Navigate to: Topology => Clusters => (instance) => Dynamic Servers

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Calculated Listen Ports | CalculatedListenPorts |  |
|Calculated Machine Names | CalculatedMachineNames |  |
|Dynamic Cluster Cool-Off Period Seconds | DynamicClusterCooloffPeriodSeconds | "WLDF Elasticity Framework Settings" collapsible |
|Dynamic Cluster Shutdown Timeout Seconds | DynamicClusterShutdownTimeoutSeconds | "WLDF Elasticity Framework Settings" collapsible |
|Dynamic Cluster Size | DynamicClusterSize |  |
|Ignore Sessions During Shutdown | IgnoreSessionsDuringShutdown | "WLDF Elasticity Framework Settings" collapsible |
|Machine Match Expression | MachineMatchExpression |  |
|Machine Match Type | MachineMatchType |  |
|Machine Name Match Expression | MachineNameMatchExpression |  |
|Max Dynamic Cluster Size | MaxDynamicClusterSize | "WLDF Elasticity Framework Settings" collapsible |
|Min Dynamic Cluster Size | MinDynamicClusterSize | "WLDF Elasticity Framework Settings" collapsible |
|Notes | Notes |  |
|Server Name Prefix | ServerNamePrefix |  |
|Server Name Starting Index | ServerNameStartingIndex |  |
|Server Template | ServerTemplate |  |
|Wait For All Sessions During Shutdown | WaitForAllSessionsDuringShutdown | "WLDF Elasticity Framework Settings" collapsible |

### Cluster / JTACluster
Navigate to: Topology => Clusters => (instance) => JTA Cluster

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Abandon Timeout Seconds | AbandonTimeoutSeconds |  |
|Before Completion Iteration Limit | BeforeCompletionIterationLimit |  |
|Checkpoint Interval Seconds | CheckpointIntervalSeconds |  |
|Cluster-Wide Recovery Enabled | ClusterwideRecoveryEnabled |  |
|Completion Timeout Seconds | CompletionTimeoutSeconds | "Advanced" collapsible |
|Cross Site Recovery Lease Expiration | CrossSiteRecoveryLeaseExpiration | "Advanced" collapsible |
|Cross Site Recovery Lease Update | CrossSiteRecoveryLeaseUpdate | "Advanced" collapsible |
|Cross Site Recovery Retry Interval | CrossSiteRecoveryRetryInterval | "Advanced" collapsible |
|Determiners | Determiner |  |
|Forget Heuristics | ForgetHeuristics |  |
|Local Domain Security Cache Enabled | LocalDomainSecurityCacheEnabled | "Advanced" collapsible |
|Local Domain Security Cache Time-to-Live | LocalDomainSecurityCacheTtl | "Advanced" collapsible |
|Local Domain Security Enabled | LocalDomainSecurityEnabled | "Advanced" collapsible |
|Max Resource Requests On Server | MaxResourceRequestsOnServer | "Advanced" collapsible |
|Max Resource Unavailable Milliseconds | MaxResourceUnavailableMillis | "Advanced" collapsible |
|Max Retry Seconds Before Determiner Fail | MaxRetrySecondsBeforeDeterminerFail |  |
|Max Transactions | MaxTransactions |  |
|Max Transactions Health Interval Millis | MaxTransactionsHealthIntervalMillis | "Advanced" collapsible |
|Max Unique Name Statistics | MaxUniqueNameStatistics |  |
|Max XA Call Milliseconds | MaxXACallMillis | "Advanced" collapsible |
|Migration Checkpoint Interval Seconds | MigrationCheckpointIntervalSeconds | "Advanced" collapsible |
|Notes | Notes |  |
|Parallel XA Dispatch Policy | ParallelXADispatchPolicy |  |
|Parallel XA Enabled | ParallelXAEnabled |  |
|Purge Resource From Checkpoint Interval Seconds | PurgeResourceFromCheckpointIntervalSeconds | "Advanced" collapsible |
|Recovery Site Name | RecoverySiteName | "Advanced" collapsible |
|Security Interop Mode | SecurityInteropMode | "Advanced" collapsible |
|Serialize Enlistments GC Interval Milliseconds | SerializeEnlistmentsGCIntervalMillis | "Advanced" collapsible |
|Shutdown Grace Period | ShutdownGracePeriod | "Advanced" collapsible |
|Tightly-Coupled Transactions Enabled | TightlyCoupledTransactionsEnabled |  |
|Timeout Seconds | TimeoutSeconds |  |
|TLOG Write When Determiner Exists Enabled | TlogWriteWhenDeterminerExistsEnabled |  |
|Two Phase Enabled | TwoPhaseEnabled |  |
|Unregister Resource Grace Period | UnregisterResourceGracePeriod |  |
|Use Non-Secure Addresses For Domains | UseNonSecureAddressesForDomain | "Advanced" collapsible |
|Use Public Addresses For Remote Domains | UsePublicAddressesForRemoteDomain | "Advanced" collapsible |
|WS-AT Issued Token Enabled | WsatIssuedTokenEnabled | "Advanced" collapsible |
|WS-AT Transport Security Mode | WsatTransportSecurityMode | "Advanced" collapsible |

### Cluster / JTACluster / JtaRemoteDomain
Navigate to: Topology => Clusters => (instance) => JTA Cluster => JTA Remote Domains => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|URL | Url |  |

### Cluster / OverloadProtection
Navigate to: Topology => Clusters => (instance) => Overload Protection

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Failure Action | FailureAction |  |
|Free Memory Percent High Threshold | FreeMemoryPercentHighThreshold |  |
|Free Memory Percent Low Threshold | FreeMemoryPercentLowThreshold |  |
|Notes | Notes |  |
|Panic Action | PanicAction |  |
|Shared Capacity For Work Managers | SharedCapacityForWorkManagers |  |

### Cluster / OverloadProtection / ServerFailureTrigger
Navigate to: Topology => Clusters => (instance) => Overload Protection => Server Failure Trigger

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Heap Dump On Deadlock | HeapDumpingOnDeadlock |  |
|Heap Dump On Max Stuck Threads | HeapDumpingOnMaxStuckThread |  |
|Max Stuck Thread Time | MaxStuckThreadTime |  |
|Stuck Thread Count | StuckThreadCount |  |
|Notes | Notes |  |
|Verbose Stuck Thread Name | VerboseStuckThreadName |  |

### Cluster / WeblogicPluginRouting
Navigate to: Topology => Clusters => (instance) => WebLogic Plug-in Routing

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Exclude Cluster Members | ExcludeClusterMembers |  |
|Notes | Notes |  |

### CoherenceClusterSystemResource
Navigate to: Resources => Coherence Cluster System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName | "Advanced" collapsible |
|Deployment Order | DeploymentOrder |  |
|Deployment Principal Name | DeploymentPrincipalName | "Advanced" collapsible |
|Descriptor File Name | DescriptorFileName |  |
|Module Type | ModuleType | "Advanced" collapsible |
|Notes | Notes |  |
|Report Group File | ReportGroupFile | "Advanced" collapsible |
|Source Path | SourcePath | "Advanced" collapsible |
|Targets | Target |  |
|Using Custom Cluster Configuration File | UsingCustomClusterConfigurationFile | "Advanced" collapsible |

### CoherenceClusterSystemResource / CoherenceCacheConfig
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cache Configurations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cache Configuration File | CacheConfigurationFile |  |
|Compatibility Name | CompatibilityName | "Advanced" collapsible |
|JNDI Name | JNDIName |  |
|Module Type | ModuleType | "Advanced" collapsible |
|Notes | Notes |  |
|Runtime Cache Configuration URI | RuntimeCacheConfigurationUri |  |
|Targets | Target |  |

### CoherenceClusterSystemResource / CoherenceResource
Navigate to: Resources => Coherence Cluster System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Custom Cluster Configuration File Name | CustomClusterConfigurationFileName | "Advanced" collapsible |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceAddressProvider
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Address Providers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### CoherenceClusterSystemResource / CoherenceResource / CoherenceAddressProvider / CoherenceSocketAddress
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Address Providers => (instance) => Socket Addresses => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Address | Address |  |
|Port | Port |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cluster Listen Port | ClusterListenPort |  |
|Clustering Mode | ClusteringMode |  |
|Discovery Address | DiscoveryAddress | "Advanced" collapsible |
|Global Socket Provider | GlobalSocketProvider | "Advanced" collapsible |
|Ignore Hostname Verification | IgnoreHostnameVerification |  |
|Multicast Listen Address | MulticastListenAddress |  |
|Secured Production | SecuredProduction |  |
|Security Framework Enabled | SecurityFrameworkEnabled | "Advanced" collapsible |
|Time-to-Live | TimeToLive |  |
|Transport | Transport |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceCache
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Coherence Caches => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Partition | Partition |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceClusterWellKnownAddress
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Well-Known Addresses => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Listen Address | ListenAddress |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceIdentityAsserter
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Identity Asserter

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class Name | ClassName |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceIdentityAsserter / CoherenceInitParam
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Identity Asserter => Initialization Parameters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Param Type | ParamType |  |
|Param Value | ParamValue |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceKeystoreParams
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Keystore Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Client Authentication Mode | CoherenceClientAuth |  |
|Identity Alias | CoherenceIdentityAlias |  |
|Key Refresh Period | CoherenceKeyRefreshPeriod |  |
|Private Key Passphrase | CoherencePrivateKeyPassPhraseEncrypted |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceClusterParams / CoherenceService
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Cluster Parameters => Coherence Services => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Partition | Partition |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceFederationParams
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Federation Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Federation Topology | FederationTopology |  |
|Remote Coherence Cluster Listen Port | RemoteCoherenceClusterListenPort |  |
|Remote Coherence Cluster Name | RemoteCoherenceClusterName |  |
|Remote Participant Hosts | RemoteParticipantHost |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherenceLoggingParams
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Character Limit | CharacterLimit |  |
|Enabled | Enabled |  |
|Logger Name | LoggerName |  |
|Message Format | MessageFormat |  |
|Severity Level | SeverityLevel |  |

### CoherenceClusterSystemResource / CoherenceResource / CoherencePersistenceParams
Navigate to: Resources => Coherence Cluster System Resources => (instance) => Persistence Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Directory | ActiveDirectory |  |
|Backup Directory | BackupDirectory |  |
|Default Persistence Mode | DefaultPersistenceMode |  |
|Events Directory | EventsDirectory |  |
|Snapshot Directory | SnapshotDirectory |  |
|Trash Directory | TrashDirectory |  |

### DbClientDataDirectory
Navigate to: Deployments => DB Client Data Directories => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Source Path | SourcePath |  |
|Staging Mode | StagingMode |  |

### DomainInfo
Navigate to: Domain Info

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Admin Password | AdminPassword |  |
|Admin User Name | AdminUserName |  |
|Application Directory | AppDir |  |
|OPSS Wallet Passphrase | OPSSWalletPassphrase | "Advanced" collapsible |
|Server Group Targeting Limits | ServerGroupTargetingLimits | "Advanced" collapsible |
|Dynamic Cluster Server Group Targeting Limits | DynamicClusterServerGroupTargetingLimits | "Advanced" collapsible |
|Server Start Mode | ServerStartMode |  |
|Use Sample Database | UseSampleDatabase | "Advanced" collapsible |
|Enable JMS Store Database Persistence | EnableJMSStoreDBPersistence | "Advanced" collapsible |
|Enable JTA TLog Database Persistence | EnableJTATLogDBPersistence | "Advanced" collapsible |
|Domain Binaries | domainBin |  |
|Domain Libraries | domainLibraries |  |

### EJBContainer
Navigate to: Resources => EJB Container

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Extra EJB Compiler Options | ExtraEjbcOptions |  |
|Extra RMI Compiler Options | ExtraRmicOptions |  |
|Force Generation | ForceGeneration |  |
|Java Compiler | JavaCompiler |  |
|Java Compiler Post Class Path | JavaCompilerPostClassPath |  |
|Java Compiler Pre Class Path | JavaCompilerPreClassPath |  |
|Keep Generated | KeepGenerated |  |
|Notes | Notes |  |
|Temporary Directory Path | TmpPath |  |

### EmbeddedLDAP
Navigate to: Topology => Embedded LDAP

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Anonymous Bind Allowed | AnonymousBindAllowed |  |
|Backup Copies | BackupCopies |  |
|Backup Hour | BackupHour |  |
|Backup Minute | BackupMinute |  |
|Cache Enabled | CacheEnabled |  |
|Cache Size | CacheSize |  |
|Cache Time-to-Live | CacheTTL |  |
|Credential | CredentialEncrypted |  |
|Keep Alive Enabled | KeepAliveEnabled |  |
|Master First | MasterFirst |  |
|Notes | Notes |  |
|Refresh Replica At Startup | RefreshReplicaAtStartup |  |
|Timeout | Timeout |  |

### FileStore
Navigate to: Resources => File Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Block Size | BlockSize | "General" tab => "Advanced" collapsible |
|Cache Directory | CacheDirectory | "General" tab |
|Deployment Order | DeploymentOrder | "General" tab |
|Directory | Directory | "General" tab |
|Distribution Policy | DistributionPolicy | "High Availability" tab |
|Fail Over Limit | FailOverLimit | "High Availability" tab |
|Failback Delay Seconds | FailbackDelaySeconds | "High Availability" tab |
|File Locking Enabled | FileLockingEnabled | "General" tab => "Advanced" collapsible |
|Initial Boot Delay Seconds | InitialBootDelaySeconds | "High Availability" tab |
|Initial Size | InitialSize | "General" tab => "Advanced" collapsible |
|I/O Buffer Size | IoBufferSize | "General" tab => "Advanced" collapsible |
|Logical Name | LogicalName | "General" tab => "Advanced" collapsible |
|Max File Size | MaxFileSize | "General" tab => "Advanced" collapsible |
|Max Window Buffer Size | MaxWindowBufferSize | "General" tab => "Advanced" collapsible |
|Migration Policy | MigrationPolicy | "High Availability" tab |
|Min Window Buffer Size | MinWindowBufferSize | "General" tab => "Advanced" collapsible |
|Notes | Notes | "General" tab |
|Number Of Restart Attempts | NumberOfRestartAttempts | "High Availability" tab |
|Partial Cluster Stability Delay Seconds | PartialClusterStabilityDelaySeconds | "High Availability" tab |
|Rebalance Enabled | RebalanceEnabled | "High Availability" tab |
|Restart In Place | RestartInPlace | "High Availability" tab |
|Seconds Between Restarts | SecondsBetweenRestarts | "High Availability" tab |
|Synchronous Write Policy | SynchronousWritePolicy | "General" tab |
|Targets | Target | "General" tab |
|XA Resource Name | XAResourceName | "General" tab => "Advanced" collapsible |

### ForeignJNDIProvider
Navigate to: Resources => Foreign JNDI Providers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Initial Context Factory Class Name | InitialContextFactory |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Properties | Properties |  |
|Provider URL | ProviderUrl |  |
|User | User |  |
|Targets | Target |  |

### ForeignJNDIProvider / ForeignJNDILink
Navigate to: Resources => Foreign JNDI Providers => (instance) => Foreign JNDI Links => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local JNDI Name | LocalJNDIName |  |
|Remote JNDI Name | RemoteJNDIName |  |
|Notes | Notes |  |

### HealthScore
Navigate to: Topology => Health Score

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Calculate Interval Seconds | CalculateIntervalSecs |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Plug-in Class Name | PluginClassName |  |

### JDBCStore
Navigate to: Resources => JDBC Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Caching Policy | ConnectionCachingPolicy | "Tuning Parameters" tab |
|Create Table DDL File | CreateTableDDLFile | "General" tab => "Advanced" collapsible |
|Data Source | DataSource | "General" tab |
|Deletes Per Batch Maximum | DeletesPerBatchMaximum | "Tuning Parameters" tab |
|Deletes Per Statement Maximum | DeletesPerStatementMaximum | "Tuning Parameters" tab |
|Deployment Order | DeploymentOrder | "General" tab |
|Distribution Policy | DistributionPolicy | "High Availability" tab |
|Failback Delay Seconds | FailbackDelaySeconds | "High Availability" tab |
|Fail Over Limit | FailOverLimit | "High Availability" tab |
|Initial Boot Delay Seconds | InitialBootDelaySeconds | "High Availability" tab |
|Inserts Per Batch Maximum | InsertsPerBatchMaximum | "Tuning Parameters" tab |
|Logical Name | LogicalName | "General" tab => "Advanced" collapsible |
|Migration Policy | MigrationPolicy | "High Availability" tab |
|Notes | Notes | "General" tab |
|Number Of Restart Attempts | NumberOfRestartAttempts | "High Availability" tab |
|Oracle Piggyback Commit Enabled | OraclePiggybackCommitEnabled | "Tuning Parameters" tab |
|Partial Cluster Stability Delay Seconds | PartialClusterStabilityDelaySeconds | "High Availability" tab |
|Prefix Name | PrefixName | "General" tab |
|Rebalance Enabled | RebalanceEnabled | "High Availability" tab |
|Reconnect Retry Interval Milliseconds | ReconnectRetryIntervalMillis | "High Availability" tab |
|Reconnect Retry Period Milliseconds | ReconnectRetryPeriodMillis | "High Availability" tab |
|Restart In Place | RestartInPlace | "High Availability" tab |
|Seconds Between Restarts | SecondsBetweenRestarts | "High Availability" tab |
|Targets | Target | "General" tab |
|Three Step Threshold | ThreeStepThreshold | "Tuning Parameters" tab |
|Worker Count | WorkerCount | "Tuning Parameters" tab |
|Worker Preferred Batch Size | WorkerPreferredBatchSize | "Tuning Parameters" tab |
|XA Resource Name | XAResourceName | "General" tab => "Advanced" collapsible |

### JDBCSystemResource
Navigate to: Resources => JDBC System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName | "General" tab => "Advanced" collapsible |
|Descriptor File Name | DescriptorFileName | "General" tab |
|Deployment Order | DeploymentOrder | "General" tab |
|Deployment Principal Name | DeploymentPrincipalName | "General" tab => "Advanced" collapsible |
|Module Type | ModuleType | "General" tab => "Advanced" collapsible |
|Notes | Notes | "General" tab |
|Targets | Target | "General" tab |

### JDBCSystemResource / JdbcResource
Navigate to: Resources => JDBC System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Data Source Type | DatasourceType | "General" tab |

### JDBCSystemResource / JdbcResource / JDBCConnectionPoolParams
Navigate to: Resources => JDBC System Resources => (instance) => JDBC Connection Pool Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Creation Retry Frequency Seconds | ConnectionCreationRetryFrequencySeconds | "General" tab |
|Connection Harvest Max Count | ConnectionHarvestMaxCount | "Diagnostics" tab |
|Connection Harvest Trigger Count | ConnectionHarvestTriggerCount | "Diagnostics" tab |
|Connection Labeling Callback | ConnectionLabelingCallback | "Diagnostics" tab |
|Connection Reserve Timeout Seconds | ConnectionReserveTimeoutSeconds | "Connection Testing" tab |
|Count Of Refresh Failures Till Disable | CountOfRefreshFailuresTillDisable | "General" tab |
|Count Of Test Failures Till Flush | CountOfTestFailuresTillFlush | "Connection Testing" tab |
|Credential Mapping Enabled | CredentialMappingEnabled | "General" tab => "Advanced" collapsible |
|Driver Interceptor | DriverInterceptor | "Diagnostics" tab |
|Fatal Error Codes | FatalErrorCodes | "General" tab => "Advanced" collapsible |
|Hang Detection Max Test Wait Seconds | HangDetectionMaxTestWaitSeconds | "Connection Testing" tab |
|Highest Number of Waiters | HighestNumWaiters | "General" tab => "Advanced" collapsible |
|Identity-Based Connection Pooling Enabled | IdentityBasedConnectionPoolingEnabled | "General" tab => "Advanced" collapsible |
|Ignore In Use Connections Enabled | IgnoreInUseConnectionsEnabled | "General" tab => "Advanced" collapsible |
|Inactive Connection Timeout Seconds | InactiveConnectionTimeoutSeconds | "General" tab => "Advanced" collapsible |
|Initialization SQL | InitSql | "General" tab => "Advanced" collapsible |
|Initial Capacity | InitialCapacity | "General" tab |
|Invoke Begin End Request | InvokeBeginEndRequest | "General" tab => "Advanced" collapsible |
|JDBC XA Debug Level | JDBCXADebugLevel | "Diagnostics" tab |
|Login Delay Seconds | LoginDelaySeconds | "General" tab |
|Max Capacity | MaxCapacity | "General" tab |
|Min Capacity | MinCapacity | "General" tab |
|Pinned To Thread | PinnedToThread | "General" tab => "Advanced" collapsible |
|Profile Connection Leak Timeout Seconds | ProfileConnectionLeakTimeoutSeconds | "Diagnostics" tab |
|Profile Harvest Frequency Seconds | ProfileHarvestFrequencySeconds | "Diagnostics" tab |
|Profile Type | ProfileType | "Diagnostics" tab |
|Refresh Available After Test Failure | RefreshAvailableAfterTestFailure | "Connection Testing" tab |
|Remove Infected Connections | RemoveInfectedConnections | "General" tab => "Advanced" collapsible |
|Shrink Factor Percent | ShrinkFactorPercent | "General" tab => "Advanced" collapsible |
|Shrink History Seconds | ShrinkHistorySeconds | "General" tab => "Advanced" collapsible |
|Shrink Spare Capacity Percent | ShrinkSpareCapacityPercent | "General" tab => "Advanced" collapsible |
|Seconds To Trust An Idle Pool Connection | SecondsToTrustAnIdlePoolConnection | "Connection Testing" tab |
|Shrink Frequency Seconds | ShrinkFrequencySeconds | "General" tab => "Advanced" collapsible |
|Statement Cache Size | StatementCacheSize | "General" tab |
|Statement Cache Type | StatementCacheType | "General" tab |
|Statement Timeout | StatementTimeout | "General" tab |
|Test Connections On Reserve | TestConnectionsOnReserve | "Connection Testing" tab |
|Test Frequency Seconds | TestFrequencySeconds | "Connection Testing" tab |
|Test Table Name | TestTableName | "Connection Testing" tab |
|Test Timeout Seconds | TestTimeoutSeconds | "Connection Testing" tab |
|Wrap Types | WrapTypes | "General" tab => "Advanced" collapsible |
|Wrap JDBC | WrapJdbc | "General" tab => "Advanced" collapsible |

### JDBCSystemResource / JdbcResource / JDBCDataSourceParams
Navigate to: Resources => JDBC System Resources => (instance) => JDBC Data Source Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Algorithm Type | AlgorithmType | "Multi DataSource Parameters" section |
|Data Source List | DataSourceList | "Multi DataSource Parameters" section |
|Connection Pool Failover Callback Handler | ConnectionPoolFailoverCallbackHandler | "Multi DataSource Parameters" section |
|Failover Request If Busy | FailoverRequestIfBusy | "Multi DataSource Parameters" section |
|Global Transactions Protocol | GlobalTransactionsProtocol |  |
|Keep Connection After Global Transaction | KeepConnAfterGlobalTx |  |
|JNDI Names | JNDIName |  |
|Proxy Switching Callback | ProxySwitchingCallback | "Proxy DataSource Parameters" section |
|Proxy Switching Properties | ProxySwitchingProperties | "Proxy DataSource Parameters" section |

### JDBCSystemResource / JdbcResource / JDBCDriverParams
Navigate to: Resources => JDBC System Resources => (instance) => JDBC Driver Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Driver Name | DriverName |  |
|URL | URL |  |
|Password | PasswordEncrypted |  |
|Use Password Indirection | UsePasswordIndirection |  |
|Use XA Data Source Interface | UseXaDataSourceInterface |  |

### JDBCSystemResource / JdbcResource / JDBCDriverParams / Properties
Navigate to: Resources => JDBC System Resources => (instance) => JDBC Driver Parameters => Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypted Value | EncryptedValueEncrypted |  |
|Value | Value |  |
|System Property Value | SysPropValue |  |

### JDBCSystemResource / JdbcResource / JDBCOracleParams
Navigate to: Resources => JDBC System Resources => (instance) => JDBC Oracle Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Gridlink | ActiveGridlink |  |
|Affinity Policy | AffinityPolicy |  |
|Connection Initialization Callback | ConnectionInitializationCallback |  |
|FAN Enabled | FanEnabled |  |
|ONS Node List | OnsNodeList |  |
|ONS Wallet File | OnsWalletFile |  |
|ONS Wallet Password | OnsWalletPasswordEncrypted |  |
|Oracle Optimize UTF8 Conversion | OracleOptimizeUtf8Conversion |  |
|Oracle Proxy Session | OracleProxySession |  |
|Rebalance On Up Event | RebalanceOnUpEvent |  |
|Replay Initiation Timeout | ReplayInitiationTimeout |  |
|Use Database Credentials | UseDatabaseCredentials |  |

### JDBCSystemResource / JdbcResource / JDBCXAParams
Navigate to: Resources => JDBC System Resources => (instance) => JDBC XA Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Keep Logical Connection Open On Release | KeepLogicalConnOpenOnRelease |  |
|Keep XA Connection Until Transaction Completes | KeepXaConnTillTxComplete |  |
|Need Transaction Context On Close | NeedTxCtxOnClose |  |
|New XA Connection For Commit | NewXaConnForCommit |  |
|Recover Only Once | RecoverOnlyOnce |  |
|Resource Health Monitoring | ResourceHealthMonitoring |  |
|XA Retry Duration Seconds | XaRetryDurationSeconds |  |
|XA Retry Interval Seconds | XaRetryIntervalSeconds |  |
|XA Set Transaction Timeout | XaSetTransactionTimeout |  |
|XA Transaction Timeout | XaTransactionTimeout |  |

### JMSBridgeDestination
Navigate to: Resources => JMS Bridge Destinations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Adapter JNDI Name | AdapterJNDIName |  |
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Connection URL | ConnectionURL |  |
|Destination JNDI Name | DestinationJNDIName |  |
|Destination Type | DestinationType |  |
|Initial Context Factory Class Name | InitialContextFactory |  |
|Notes | Notes |  |
|User Name | UserName |  |
|User Password | UserPasswordEncrypted |  |

### JMSServer
Navigate to: Resources => JMS Servers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allows Persistent Downgrade | AllowsPersistentDowngrade | "General" tab |
|Blocking Send Policy | BlockingSendPolicy | "Thresholds" tab |
|Bytes Maximum | BytesMaximum | "Thresholds" tab |
|Bytes Threshold High | BytesThresholdHigh | "Thresholds" tab |
|Bytes Threshold Low | BytesThresholdLow | "Thresholds" tab |
|Consumption Paused At Startup | ConsumptionPausedAtStartup | "General" tab => "Advanced" collapsible |
|Deployment Order | DeploymentOrder | "General" tab |
|Expiration Scan Interval | ExpirationScanInterval | "General" tab |
|Hosting Temporary Destinations | HostingTemporaryDestinations | "General" tab |
|Insertion Paused At Startup | InsertionPausedAtStartup | "General" tab => "Advanced" collapsible |
|JDBC Store Upgrade Enabled | JDBCStoreUpgradeEnabled | "General" tab => "Advanced" collapsible |
|Maximum Message Size | MaximumMessageSize | "Thresholds" tab |
|Message Buffer Size | MessageBufferSize | "General" tab |
|Message Compression Options | MessageCompressionOptions | "General" tab => "Advanced" collapsible |
|Messages Maximum | MessagesMaximum | "Thresholds" tab |
|Messages Threshold High | MessagesThresholdHigh | "Thresholds" tab |
|Messages Threshold Low | MessagesThresholdLow | "Thresholds" tab |
|Notes | Notes | "General" tab |
|Paging Block Size | PagingBlockSize | "Paging Configuration" tab |
|Paging Directory | PagingDirectory | "Paging Configuration" tab |
|Paging File Locking Enabled | PagingFileLockingEnabled | "Paging Configuration" tab |
|Paging I/O Buffer Size | PagingIoBufferSize | "Paging Configuration" tab |
|Paging Max File Size | PagingMaxFileSize | "Paging Configuration" tab |
|Paging Max Window Buffer Size | PagingMaxWindowBufferSize | "Paging Configuration" tab |
|Paging Message Compression Enabled | PagingMessageCompressionEnabled | "Paging Configuration" tab |
|Paging Min Window Buffer Size | PagingMinWindowBufferSize | "Paging Configuration" tab |
|Persistent Store | PersistentStore | "General" tab |
|Production Paused At Startup | ProductionPausedAtStartup | "General" tab => "Advanced" collapsible |
|Store Enabled | StoreEnabled | "General" tab |
|Store Message Compression Enabled | StoreMessageCompressionEnabled | "General" tab => "Advanced" collapsible |
|Targets | Target | "General" tab |
|Temporary Template Name | TemporaryTemplateName | "General" tab |
|Temporary Template Resource | TemporaryTemplateResource | "General" tab |

### JMSServer / JmsMessageLogFile
Navigate to: Resources => JMS Servers => (instance) => JMS Message Log File

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb |  |
|Date Format Pattern | DateFormatPattern |  |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Rotation Directory | LogFileRotationDir |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### JMSSystemResource
Navigate to: Resources => JMS System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName | "Advanced" collapsible |
|Deployment Order | DeploymentOrder |  |
|Deployment Principal Name | DeploymentPrincipalName | "Advanced" collapsible |
|Descriptor File Name | DescriptorFileName |  |
|Module Type | ModuleType | "Advanced" collapsible |
|Notes | Notes |  |
|Targets | Target |  |

### JMSSystemResource / JmsResource
Navigate to: Resources => JMS System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |

### JMSSystemResource / JmsResource / ConnectionFactory
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|JNDI Name | JNDIName |  |
|Local JNDI Name | LocalJNDIName |  |
|Notes | Notes |  |
|SubDeployment Name | SubDeploymentName |  |

### JMSSystemResource / JmsResource / ConnectionFactory / ClientParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Client Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Acknowledge Policy | AcknowledgePolicy |  |
|Allow Close In On Message | AllowCloseInOnMessage |  |
|Client ID | ClientId |  |
|Client ID Policy | ClientIdPolicy |  |
|Messages Maximum | MessagesMaximum |  |
|Multicast Overrun Policy | MulticastOverrunPolicy |  |
|Reconnect Blocking Milliseconds | ReconnectBlockingMillis |  |
|Reconnect Policy | ReconnectPolicy |  |
|Subscription Sharing Policy | SubscriptionSharingPolicy |  |
|Synchronous Prefetch Mode | SynchronousPrefetchMode |  |
|Total Reconnect Period Milliseconds | TotalReconnectPeriodMillis |  |

### JMSSystemResource / JmsResource / ConnectionFactory / DefaultDeliveryParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Default Delivery Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Compression Threshold | DefaultCompressionThreshold |  |
|Default Delivery Mode | DefaultDeliveryMode |  |
|Default Priority | DefaultPriority |  |
|Default Redelivery Delay | DefaultRedeliveryDelay |  |
|Default Time To Deliver | DefaultTimeToDeliver |  |
|Default Time-to-Live | DefaultTimeToLive |  |
|Default Unit Of Order | DefaultUnitOfOrder |  |
|Send Timeout | SendTimeout |  |

### JMSSystemResource / JmsResource / ConnectionFactory / FlowControlParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Flow Control Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Flow Control Enabled | FlowControlEnabled |  |
|Flow Interval | FlowInterval |  |
|Flow Maximum | FlowMaximum |  |
|Flow Minimum | FlowMinimum |  |
|Flow Steps | FlowSteps |  |
|One-Way Send Mode | OneWaySendMode |  |
|One-Way Send Window Size | OneWaySendWindowSize |  |

### JMSSystemResource / JmsResource / ConnectionFactory / LoadBalancingParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Load Balancing Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Load Balancing Enabled | LoadBalancingEnabled |  |
|Producer Load Balancing Policy | ProducerLoadBalancingPolicy |  |
|Server Affinity Enabled | ServerAffinityEnabled |  |

### JMSSystemResource / JmsResource / ConnectionFactory / SecurityParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Security Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach JMSXUserID | AttachJMSXUserId |  |
|Security Policy | SecurityPolicy |  |

### JMSSystemResource / JmsResource / ConnectionFactory / TransactionParams
Navigate to: Resources => JMS System Resources => (instance) => Connection Factories => (instance) => Transaction Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Transaction Timeout | TransactionTimeout |  |
|XA Connection Factory Enabled | XAConnectionFactoryEnabled |  |

### JMSSystemResource / JmsResource / DestinationKey
Navigate to: Resources => JMS System Resources => (instance) => Destination Keys => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Key Type | KeyType |  |
|Notes | Notes |  |
|Property | Property |  |
|Sort Order | SortOrder |  |

### JMSSystemResource / JmsResource / ForeignServer
Navigate to: Resources => JMS System Resources => (instance) => Foreign Servers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection URL | ConnectionURL |  |
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Initial Context Factory Class Name | InitialContextFactory |  |
|JNDI Properties Credential | JNDIPropertiesCredentialEncrypted |  |
|Notes | Notes |  |
|SubDeployment Name | SubDeploymentName |  |

### JMSSystemResource / JmsResource / ForeignServer / ForeignConnectionFactory
Navigate to: Resources => JMS System Resources => (instance) => Foreign Servers => (instance) => Foreign Connection Factories => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Health Checking | ConnectionHealthChecking |  |
|Local JNDI Name | LocalJNDIName |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Remote JNDI Name | RemoteJndiName |  |
|Username | Username |  |

### JMSSystemResource / JmsResource / ForeignServer / ForeignDestination
Navigate to: Resources => JMS System Resources => (instance) => Foreign Servers => (instance) => Foreign Destinations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local JNDI Name | LocalJNDIName |  |
|Notes | Notes |  |
|Remote JNDI Name | RemoteJndiName |  |

### JMSSystemResource / JmsResource / ForeignServer / JNDIProperty
Navigate to: Resources => JMS System Resources => (instance) => Foreign Servers => (instance) => JNDI Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Key | Key |  |
|Value | Value |  |

### JMSSystemResource / JmsResource / Queue
Navigate to: Resources => JMS System Resources => (instance) => Queues => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach Sender | AttachSender | "Advanced" collapsible |
|Consumption Paused At Startup | ConsumptionPausedAtStartup | "Advanced" collapsible |
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Default Unit Of Order | DefaultUnitOfOrder | "Advanced" collapsible |
|Destination Key | DestinationKey | "Advanced" collapsible |
|Incomplete Work Expiration Time | IncompleteWorkExpirationTime | "Advanced" collapsible |
|Insertion Paused At Startup | InsertionPausedAtStartup | "Advanced" collapsible |
|JNDI Name | JNDIName |  |
|JMS Create Destination Identifier | JmsCreateDestinationIdentifier | "Advanced" collapsible |
|Load Balancing Policy | LoadBalancingPolicy | "Advanced" collapsible |
|Local JNDI Name | LocalJNDIName |  |
|Maximum Message Size | MaximumMessageSize | "Advanced" collapsible |
|Messaging Performance Preference | MessagingPerformancePreference | "Advanced" collapsible |
|Notes | Notes |  |
|Production Paused At Startup | ProductionPausedAtStartup | "Advanced" collapsible |
|Quota | Quota | "Advanced" collapsible |
|SAF Export Policy | SafExportPolicy | "Advanced" collapsible |
|SubDeployment Name | SubDeploymentName |  |
|Template | Template | "Advanced" collapsible |
|Unit Of Work Handling Policy | UnitOfWorkHandlingPolicy | "Advanced" collapsible |

### JMSSystemResource / JmsResource / Queue / DeliveryFailureParams
Navigate to: Resources => JMS System Resources => (instance) => Queues => (instance) => Delivery Failure Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|Expiration Logging Policy | ExpirationLoggingPolicy |  |
|Expiration Policy | ExpirationPolicy |  |
|Redelivery Limit | RedeliveryLimit |  |

### JMSSystemResource / JmsResource / Queue / DeliveryParamsOverrides
Navigate to: Resources => JMS System Resources => (instance) => Queues => (instance) => Delivery Parameter Overrides

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Delivery Mode | DeliveryMode |  |
|Priority | Priority |  |
|Redelivery Delay | RedeliveryDelay |  |
|Time To Deliver | TimeToDeliver |  |
|Time-to-Live | TimeToLive |  |

### JMSSystemResource / JmsResource / Queue / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => Queues => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / Queue / Thresholds
Navigate to: Resources => JMS System Resources => (instance) => Queues => (instance) => Thresholds

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes High | BytesHigh |  |
|Bytes Low | BytesLow |  |
|Messages High | MessagesHigh |  |
|Messages Low | MessagesLow |  |

### JMSSystemResource / JmsResource / Quota
Navigate to: Resources => JMS System Resources => (instance) => Quotas => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes Maximum | BytesMaximum |  |
|Messages Maximum | MessagesMaximum |  |
|Notes | Notes |  |
|Policy | Policy |  |
|Shared | Shared |  |

### JMSSystemResource / JmsResource / SAFErrorHandling
Navigate to: Resources => JMS System Resources => (instance) => SAF Error Handlings => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Log Format | LogFormat |  |
|Notes | Notes |  |
|Policy | Policy |  |
|SAF Error Destination | SafErrorDestination |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Exactly-Once Load Balancing Policy | ExactlyOnceLoadBalancingPolicy |  |
|JNDI Prefix | JNDIPrefix |  |
|Notes | Notes |  |
|SAF Error Handling | SAFErrorHandling |  |
|SAF Remote Context | SAFRemoteContext |  |
|SubDeployment Name | SubDeploymentName |  |
|Time-to-Live Default | TimeToLiveDefault |  |
|Unit Of Order Routing | UnitOfOrderRouting |  |
|Use SAF Time-to-Live Default | UseSAFTimeToLiveDefault |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations / SAFQueue
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance) => SAF Queues => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local JNDI Name | LocalJNDIName |  |
|Non-Persistent Quality of Service | NonPersistentQos |  |
|Notes | Notes |  |
|Persistent Quality of Service | PersistentQos |  |
|Remote JNDI Name | RemoteJndiName |  |
|SAF Error Handling | SAFErrorHandling |  |
|Time-to-Live Default | TimeToLiveDefault |  |
|Unit Of Order Routing | UnitOfOrderRouting |  |
|Use SAF Time-to-Live Default | UseSAFTimeToLiveDefault |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations / SAFQueue / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance) => SAF Queues => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations / SAFTopic
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance) => SAF Topics => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local JNDI Name | LocalJNDIName |  |
|Non-Persistent Quality of Service | NonPersistentQos |  |
|Notes | Notes |  |
|Persistent Quality of Service | PersistentQos |  |
|Remote JNDI Name | RemoteJndiName |  |
|SAF Error Handling | SAFErrorHandling |  |
|Time-to-Live Default | TimeToLiveDefault |  |
|Unit Of Order Routing | UnitOfOrderRouting |  |
|Use SAF Time-to-Live Default | UseSAFTimeToLiveDefault |  |

### JMSSystemResource / JmsResource / SAFImportedDestinations / SAFTopic / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => SAF Imported Destinations => (instance) => SAF Topics => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / SAFRemoteContext
Navigate to: Resources => JMS System Resources => (instance) => SAF Remote Contexts => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compression Threshold | CompressionThreshold |  |
|Notes | Notes |  |
|Reply To SAF Remote Context Name | ReplyToSAFRemoteContextName |  |

### JMSSystemResource / JmsResource / SAFRemoteContext / SAFLoginContext
Navigate to: Resources => JMS System Resources => (instance) => SAF Remote Contexts => (instance) => SAF Login Context

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Login URL | LoginURL |  |
|Password | PasswordEncrypted |  |
|Username | Username |  |

### JMSSystemResource / JmsResource / Template
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach Sender | AttachSender |  |
|Consumption Paused At Startup | ConsumptionPausedAtStartup |  |
|Default Unit Of Order | DefaultUnitOfOrder |  |
|Destination Key | DestinationKey |  |
|Incomplete Work Expiration Time | IncompleteWorkExpirationTime |  |
|Insertion Paused At Startup | InsertionPausedAtStartup |  |
|Maximum Message Size | MaximumMessageSize |  |
|Messaging Performance Preference | MessagingPerformancePreference |  |
|Notes | Notes |  |
|Production Paused At Startup | ProductionPausedAtStartup |  |
|Quota | Quota |  |
|SAF Export Policy | SafExportPolicy |  |
|Unit Of Work Handling Policy | UnitOfWorkHandlingPolicy |  |

### JMSSystemResource / JmsResource / Template / DeliveryFailureParams
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Delivery Failure Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|Expiration Logging Policy | ExpirationLoggingPolicy |  |
|Expiration Policy | ExpirationPolicy |  |
|Redelivery Limit | RedeliveryLimit |  |

### JMSSystemResource / JmsResource / Template / DeliveryParamsOverrides
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Delivery Parameter Overrides

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Delivery Mode | DeliveryMode |  |
|Priority | Priority |  |
|Redelivery Delay | RedeliveryDelay |  |
|Time To Deliver | TimeToDeliver |  |
|Time-to-Live | TimeToLive |  |

### JMSSystemResource / JmsResource / Template / GroupParams
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Group Parameters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|SubDeployment Name | SubDeploymentName |  |

### JMSSystemResource / JmsResource / Template / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / Template / Multicast
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Multicast

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Multicast Address | MulticastAddress |  |
|Multicast Port | MulticastPort |  |
|Multicast Time-to-Live | MulticastTimeToLive |  |

### JMSSystemResource / JmsResource / Template / Thresholds
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Thresholds

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes High | BytesHigh |  |
|Bytes Low | BytesLow |  |
|Messages High | MessagesHigh |  |
|Messages Low | MessagesLow |  |

### JMSSystemResource / JmsResource / Template / TopicSubscriptionParams
Navigate to: Resources => JMS System Resources => (instance) => Templates => (instance) => Topic Subscription Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Messages Limit Override | MessagesLimitOverride |  |

### JMSSystemResource / JmsResource / Topic
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach Sender | AttachSender | "Advanced" collapsible |
|Consumption Paused At Startup | ConsumptionPausedAtStartup | "Advanced" collapsible |
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Default Unit Of Order | DefaultUnitOfOrder | "Advanced" collapsible |
|Destination Key | DestinationKey | "Advanced" collapsible |
|Incomplete Work Expiration Time | IncompleteWorkExpirationTime | "Advanced" collapsible |
|Insertion Paused At Startup | InsertionPausedAtStartup | "Advanced" collapsible |
|JNDI Name | JNDIName |  |
|JMS Create Destination Identifier | JmsCreateDestinationIdentifier | "Advanced" collapsible |
|Local JNDI Name | LocalJNDIName |  |
|Maximum Message Size | MaximumMessageSize | "Advanced" collapsible |
|Messaging Performance Preference | MessagingPerformancePreference | "Advanced" collapsible |
|Notes | Notes |  |
|Production Paused At Startup | ProductionPausedAtStartup | "Advanced" collapsible |
|Quota | Quota | "Advanced" collapsible |
|SAF Export Policy | SafExportPolicy | "Advanced" collapsible |
|SubDeployment Name | SubDeploymentName |  |
|Template | Template | "Advanced" collapsible |
|Unit Of Work Handling Policy | UnitOfWorkHandlingPolicy | "Advanced" collapsible |

### JMSSystemResource / JmsResource / Topic / DeliveryFailureParams
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Delivery Failure Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|Expiration Logging Policy | ExpirationLoggingPolicy |  |
|Expiration Policy | ExpirationPolicy |  |
|Redelivery Limit | RedeliveryLimit |  |

### JMSSystemResource / JmsResource / Topic / DeliveryParamsOverrides
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Delivery Parameter Overrides

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Delivery Mode | DeliveryMode |  |
|Priority | Priority |  |
|Redelivery Delay | RedeliveryDelay |  |
|Time To Deliver | TimeToDeliver |  |
|Time-to-Live | TimeToLive |  |

### JMSSystemResource / JmsResource / Topic / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / Topic / Multicast
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Multicast

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Multicast Address | MulticastAddress |  |
|Multicast Port | MulticastPort |  |
|Multicast Time-to-Live | MulticastTimeToLive |  |

### JMSSystemResource / JmsResource / Topic / Thresholds
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Thresholds

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes High | BytesHigh |  |
|Bytes Low | BytesLow |  |
|Messages High | MessagesHigh |  |
|Messages Low | MessagesLow |  |

### JMSSystemResource / JmsResource / Topic / TopicSubscriptionParams
Navigate to: Resources => JMS System Resources => (instance) => Topics => (instance) => Topic Subscription Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Messages Limit Override | MessagesLimitOverride |  |

### JMSSystemResource / JmsResource / UniformDistributedQueue
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Queues => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach Sender | AttachSender | "Advanced" collapsible |
|Consumption Paused At Startup | ConsumptionPausedAtStartup | "Advanced" collapsible |
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Default Unit Of Order | DefaultUnitOfOrder | "Advanced" collapsible |
|Destination Key | DestinationKey | "Advanced" collapsible |
|Forward Delay | ForwardDelay | "Advanced" collapsible |
|Incomplete Work Expiration Time | IncompleteWorkExpirationTime | "Advanced" collapsible |
|Insertion Paused At Startup | InsertionPausedAtStartup | "Advanced" collapsible |
|JNDI Name | JNDIName |  |
|JMS Create Destination Identifier | JmsCreateDestinationIdentifier | "Advanced" collapsible |
|Load Balancing Policy | LoadBalancingPolicy | "Advanced" collapsible |
|Local JNDI Name | LocalJNDIName |  |
|Maximum Message Size | MaximumMessageSize | "Advanced" collapsible |
|Messaging Performance Preference | MessagingPerformancePreference | "Advanced" collapsible |
|Notes | Notes |  |
|Production Paused At Startup | ProductionPausedAtStartup | "Advanced" collapsible |
|Quota | Quota | "Advanced" collapsible |
|Reset Delivery Count On Forward | ResetDeliveryCountOnForward | "Advanced" collapsible |
|SAF Export Policy | SafExportPolicy | "Advanced" collapsible |
|SubDeployment Name | SubDeploymentName |  |
|Template | Template | "Advanced" collapsible |
|Unit Of Order Routing | UnitOfOrderRouting | "Advanced" collapsible |
|Unit Of Work Handling Policy | UnitOfWorkHandlingPolicy | "Advanced" collapsible |

### JMSSystemResource / JmsResource / UniformDistributedQueue / DeliveryFailureParams
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Queues => (instance) => Delivery Failure Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|Expiration Logging Policy | ExpirationLoggingPolicy |  |
|Expiration Policy | ExpirationPolicy |  |
|Redelivery Limit | RedeliveryLimit |  |

### JMSSystemResource / JmsResource / UniformDistributedQueue / DeliveryParamsOverrides
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Queues => (instance) => Delivery Parameter Overrides

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Delivery Mode | DeliveryMode |  |
|Priority | Priority |  |
|Redelivery Delay | RedeliveryDelay |  |
|Time To Deliver | TimeToDeliver |  |
|Time-to-Live | TimeToLive |  |

### JMSSystemResource / JmsResource / UniformDistributedQueue / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Queues => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / UniformDistributedQueue / Thresholds
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Queues => (instance) => Thresholds

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes High | BytesHigh |  |
|Bytes Low | BytesLow |  |
|Messages High | MessagesHigh |  |
|Messages Low | MessagesLow |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attach Sender | AttachSender | "Advanced" collapsible |
|Consumption Paused At Startup | ConsumptionPausedAtStartup | "Advanced" collapsible |
|Default Targeting Enabled | DefaultTargetingEnabled |  |
|Default Unit Of Order | DefaultUnitOfOrder | "Advanced" collapsible |
|Destination Key | DestinationKey | "Advanced" collapsible |
|Forwarding Policy | ForwardingPolicy | "Advanced" collapsible |
|Incomplete Work Expiration Time | IncompleteWorkExpirationTime | "Advanced" collapsible |
|Insertion Paused At Startup | InsertionPausedAtStartup | "Advanced" collapsible |
|JNDI Name | JNDIName |  |
|JMS Create Destination Identifier | JmsCreateDestinationIdentifier | "Advanced" collapsible |
|Load Balancing Policy | LoadBalancingPolicy | "Advanced" collapsible |
|Local JNDI Name | LocalJNDIName |  |
|Maximum Message Size | MaximumMessageSize | "Advanced" collapsible |
|Messaging Performance Preference | MessagingPerformancePreference | "Advanced" collapsible |
|Notes | Notes |  |
|Production Paused At Startup | ProductionPausedAtStartup | "Advanced" collapsible |
|Quota | Quota | "Advanced" collapsible |
|SAF Export Policy | SafExportPolicy | "Advanced" collapsible |
|SubDeployment Name | SubDeploymentName |  |
|Template | Template | "Advanced" collapsible |
|Unit Of Order Routing | UnitOfOrderRouting | "Advanced" collapsible |
|Unit Of Work Handling Policy | UnitOfWorkHandlingPolicy | "Advanced" collapsible |

### JMSSystemResource / JmsResource / UniformDistributedTopic / DeliveryFailureParams
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Delivery Failure Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Error Destination | ErrorDestination |  |
|Expiration Logging Policy | ExpirationLoggingPolicy |  |
|Expiration Policy | ExpirationPolicy |  |
|Redelivery Limit | RedeliveryLimit |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic / DeliveryParamsOverrides
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Delivery Parameter Overrides

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Delivery Mode | DeliveryMode |  |
|Priority | Priority |  |
|Redelivery Delay | RedeliveryDelay |  |
|Time To Deliver | TimeToDeliver |  |
|Time-to-Live | TimeToLive |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic / MessageLoggingParams
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Message Logging Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Message Logging Enabled | MessageLoggingEnabled |  |
|Message Logging Format | MessageLoggingFormat |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic / Multicast
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Multicast

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Multicast Address | MulticastAddress |  |
|Multicast Port | MulticastPort |  |
|Multicast Time-to-Live | MulticastTimeToLive |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic / Thresholds
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Thresholds

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Bytes High | BytesHigh |  |
|Bytes Low | BytesLow |  |
|Messages High | MessagesHigh |  |
|Messages Low | MessagesLow |  |

### JMSSystemResource / JmsResource / UniformDistributedTopic / TopicSubscriptionParams
Navigate to: Resources => JMS System Resources => (instance) => Uniform Distributed Topics => (instance) => Topic Subscription Parameters

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Messages Limit Override | MessagesLimitOverride |  |

### JMSSystemResource / SubDeployment
Navigate to: Resources => JMS System Resources => (instance) => SubDeployments => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName | "Advanced" collapsible |
|Module Type | ModuleType | "Advanced" collapsible |
|Notes | Notes |  |
|Targets | Target |  |

### JMX
Navigate to: Topology => JMX

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility MBean Server Enabled | CompatibilityMBeanServerEnabled |  |
|Domain MBean Server Enabled | DomainMBeanServerEnabled |  |
|Edit MBean Server Enabled | EditMBeanServerEnabled |  |
|Invocation Timeout Seconds | InvocationTimeoutSeconds |  |
|Managed Server Notifications Enabled | ManagedServerNotificationsEnabled |  |
|Management Applet Create Enabled | ManagementAppletCreateEnabled |  |
|Management EJB Enabled | ManagementEJBEnabled |  |
|Notes | Notes |  |
|Platform MBean Server Enabled | PlatformMBeanServerEnabled |  |
|Platform MBean Server Used | PlatformMBeanServerUsed |  |
|Runtime MBean Server Enabled | RuntimeMBeanServerEnabled |  |

### JPA
Navigate to: Topology => JPA

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default JPA Provider | DefaultJpaProvider |  |
|Notes | Notes |  |

### JTA
Navigate to: Topology => JTA

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Abandon Timeout Seconds | AbandonTimeoutSeconds |  |
|Before Completion Iteration Limit | BeforeCompletionIterationLimit |  |
|Checkpoint Interval Seconds | CheckpointIntervalSeconds |  |
|Cluster-Wide Recovery Enabled | ClusterwideRecoveryEnabled |  |
|Completion Timeout Seconds | CompletionTimeoutSeconds | "Advanced" collapsible |
|Cross Site Recovery Lease Expiration | CrossSiteRecoveryLeaseExpiration | "Advanced" collapsible |
|Cross Site Recovery Lease Update | CrossSiteRecoveryLeaseUpdate | "Advanced" collapsible |
|Cross Site Recovery Retry Interval | CrossSiteRecoveryRetryInterval | "Advanced" collapsible |
|Determiners | Determiner |  |
|Forget Heuristics | ForgetHeuristics |  |
|Local Domain Security Cache Enabled | LocalDomainSecurityCacheEnabled | "Advanced" collapsible |
|Local Domain Security Cache Time-to-Live | LocalDomainSecurityCacheTtl | "Advanced" collapsible |
|Local Domain Security Enabled | LocalDomainSecurityEnabled | "Advanced" collapsible |
|Max Resource Requests On Server | MaxResourceRequestsOnServer | "Advanced" collapsible |
|Max Resource Unavailable Milliseconds | MaxResourceUnavailableMillis | "Advanced" collapsible |
|Max Retry Seconds Before Determiner Fail | MaxRetrySecondsBeforeDeterminerFail |  |
|Max Transactions | MaxTransactions |  |
|Max Transactions Health Interval Millis | MaxTransactionsHealthIntervalMillis | "Advanced" collapsible |
|Max Unique Name Statistics | MaxUniqueNameStatistics |  |
|Max XA Call Milliseconds | MaxXACallMillis | "Advanced" collapsible |
|Migration Checkpoint Interval Seconds | MigrationCheckpointIntervalSeconds | "Advanced" collapsible |
|Notes | Notes |  |
|Parallel XA Dispatch Policy | ParallelXADispatchPolicy |  |
|Parallel XA Enabled | ParallelXAEnabled |  |
|Purge Resource From Checkpoint Interval Seconds | PurgeResourceFromCheckpointIntervalSeconds | "Advanced" collapsible |
|Recovery Site Name | RecoverySiteName | "Advanced" collapsible |
|Security Interop Mode | SecurityInteropMode | "Advanced" collapsible |
|Serialize Enlistments GC Interval Milliseconds | SerializeEnlistmentsGCIntervalMillis | "Advanced" collapsible |
|Shutdown Grace Period | ShutdownGracePeriod | "Advanced" collapsible |
|Tightly-Coupled Transactions Enabled | TightlyCoupledTransactionsEnabled |  |
|Timeout Seconds | TimeoutSeconds |  |
|TLOG Write When Determiner Exists Enabled | TlogWriteWhenDeterminerExistsEnabled |  |
|Two Phase Enabled | TwoPhaseEnabled |  |
|Unregister Resource Grace Period | UnregisterResourceGracePeriod | "Advanced" collapsible |
|Use Non-Secure Addresses For Domains | UseNonSecureAddressesForDomain | "Advanced" collapsible |
|Use Public Addresses For Remote Domains | UsePublicAddressesForRemoteDomain | "Advanced" collapsible |
|WS-AT Issued Token Enabled | WsatIssuedTokenEnabled | "Advanced" collapsible |
|WS-AT Transport Security Mode | WsatTransportSecurityMode | "Advanced" collapsible |

### JTA / JtaRemoteDomain
Navigate to: Topology => JTA => JTA Remote Domains => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|URL | Url |  |

### JoltConnectionPool
Navigate to: Resources => Jolt Connection Pools => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Application Password | ApplicationPasswordEncrypted | "Security Configuration" tab |
|Deployment Order | DeploymentOrder | "General" tab |
|Failover Addresses | FailoverAddress | "General" tab |
|Private Key Passphrase | KeyPassPhraseEncrypted | "SSL Configuration" tab |
|Keystore Name | KeyStoreName | "SSL Configuration" tab |
|Keystore Passphrase | KeyStorePassPhraseEncrypted | "SSL Configuration" tab |
|Maximum Pool Size | MaximumPoolSize | "General" tab |
|Minimum Pool Size | MinimumPoolSize | "General" tab |
|Notes | Notes | "General" tab |
|Primary Addresses | PrimaryAddress | "General" tab |
|Receive Timeout | RecvTimeout | "General" tab |
|Security Context Enabled | SecurityContextEnabled | "Security Configuration" tab |
|Targets | Target | "General" tab |
|Trust Store Name | TrustStoreName | "SSL Configuration" tab |
|Trust Store Passphrase | TrustStorePassPhraseEncrypted | "SSL Configuration" tab |
|User Name | UserName | "Security Configuration" tab |
|User Password | UserPasswordEncrypted | "Security Configuration" tab |
|User Role | UserRole | "Security Configuration" tab |

### Library
Navigate to: Deployments => Libraries => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Alternative Descriptor Path | AltDescriptorPath | "Advanced" collapsible => "Alternate Descriptor Paths" section |
|Alternative WLS Descriptor Path | AltWLSDescriptorPath | "Advanced" collapsible => "Alternate Descriptor Paths" section |
|Cache In App Directory | CacheInAppDirectory | "Advanced" collapsible => "Library Attributes" section |
|Compatibility Name | CompatibilityName | "Advanced" collapsible => "Library Attributes" section |
|Deployment Order | DeploymentOrder |  |
|Deployment Principal Name | DeploymentPrincipalName |  |
|Install Directory | InstallDir | "Advanced" collapsible => "Library Attributes" section |
|Module Type | ModuleType |  |
|Multi Version App | MultiVersionApp | "Advanced" collapsible => "Library Attributes" section |
|Notes | Notes |  |
|Parallel Deploy Modules | ParallelDeployModules | "Advanced" collapsible => "Library Attributes" section |
|Plan Directory | PlanDir |  |
|Plan Path | PlanPath |  |
|Plan Staging Mode | PlanStagingMode |  |
|Security Deployment Descriptor Model | SecurityDDModel |  |
|Source Path | SourcePath |  |
|Staging Mode | StagingMode |  |
|Targets | Target |  |
|Validate DD Security Data | ValidateDDSecurityData |  |

### Library / SubDeployment
Navigate to: Deployments => Libraries => (instance) => SubDeployments => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName |  |
|Module Type | ModuleType |  |
|Notes | Notes |  |
|Targets | Target |  |

### Log
Navigate to: Topology => Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|Domain Log Broadcast Filter | DomainLogBroadcastFilter | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcast Severity | DomainLogBroadcastSeverity | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcaster Buffer Size | DomainLogBroadcasterBufferSize | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Filter | LogFileFilter | "Advanced" collapsible |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log File Severity | LogFileSeverity | "Advanced" collapsible |
|Log Monitoring Enabled | LogMonitoringEnabled | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Interval Seconds | LogMonitoringIntervalSecs | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Max Throttle Message Signature Count | LogMonitoringMaxThrottleMessageSignatureCount | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Message Length | LogMonitoringThrottleMessageLength | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Threshold | LogMonitoringThrottleThreshold | "Advanced" collapsible => "Log Monitoring Settings" section |
|Logger Severity | LoggerSeverity | "Advanced" collapsible |
|Logger Severity Properties | LoggerSeverityProperties | "Advanced" collapsible |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Platform Logger Levels | PlatformLoggerLevels | "Advanced" collapsible |
|Redirect Stderr To Server Log Enabled | RedirectStderrToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Redirect Stdout To Server Log Enabled | RedirectStdoutToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |
|Stacktrace Depth | StacktraceDepth | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Filter | StdoutFilter | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Format | StdoutFormat | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Log Stack | StdoutLogStack | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Severity | StdoutSeverity | "Advanced" collapsible => "Standard Out Log Settings" section |
|Trigger Truncation Stack Frame Depth After Trigger | TriggerTruncationStackFrameDepthAfterTrigger | "Advanced" collapsible => "Miscellaneous" section |
|Trigger Truncation Stack Frame Trigger Depth | TriggerTruncationStackFrameTriggerDepth | "Advanced" collapsible => "Miscellaneous" section |

### LogFilter
Navigate to: Topology => Log Filters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Filter Expression | FilterExpression |  |
|Notes | Notes |  |

### Machine
Navigate to: Topology => Machines => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |

### Machine / NodeManager
Navigate to: Topology => Machines => (instance) => Node Manager

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Debug Enabled | DebugEnabled |  |
|Listen Address | ListenAddress |  |
|Listen Port | ListenPort |  |
|Node Manager Socket Create Timeout In Milliseconds | NMSocketCreateTimeoutInMillis |  |
|Node Manager Type | NMType |  |
|Node Manager Home | NodeManagerHome |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Shell Command | ShellCommand |  |
|User Name | UserName |  |

### MailSession
Navigate to: Resources => Mail Sessions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|JNDI Name | JNDIName |  |
|Notes | Notes |  |
|Session Password | SessionPasswordEncrypted |  |
|Properties | Properties |  |
|Targets | Target |  |
|Session Username | SessionUsername |  |

### ManagedExecutorServiceTemplate
Navigate to: Resources => Managed Executor Service Templates => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Dispatch Policy | DispatchPolicy |  |
|Long Running Priority | LongRunningPriority |  |
|Max Concurrent Long Running Requests | MaxConcurrentLongRunningRequests |  |
|Notes | Notes |  |
|Targets | Target |  |

### ManagedScheduledExecutorServiceTemplate
Navigate to: Resources => Managed Scheduled Executor Service Templates => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Dispatch Policy | DispatchPolicy |  |
|Long Running Priority | LongRunningPriority |  |
|Max Concurrent Long Running Requests | MaxConcurrentLongRunningRequests |  |
|Notes | Notes |  |
|Targets | Target |  |

### ManagedThreadFactoryTemplate
Navigate to: Resources => Managed Thread Factory Templates => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Max Concurrent New Threads | MaxConcurrentNewThreads |  |
|Notes | Notes |  |
|Priority | Priority |  |
|Targets | Target |  |

### MessagingBridge
Navigate to: Resources => Messaging Bridges => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Asynchronous Messaging Mode Enabled | AsyncEnabled | "General" tab |
|Batch Interval | BatchInterval | "Transaction Parameters" tab |
|Batch Size | BatchSize | "Transaction Parameters" tab |
|Deployment Order | DeploymentOrder | "General" tab |
|Distribution Policy | DistributionPolicy | "High Availability" tab |
|Durability Enabled | DurabilityEnabled | "General" tab |
|Failback Delay Seconds | FailbackDelaySeconds | "High Availability" tab |
|Fail Over Limit | FailOverLimit | "High Availability" tab |
|Idle Time Maximum | IdleTimeMaximum | "General" tab |
|Initial Boot Delay Seconds | InitialBootDelaySeconds | "High Availability" tab |
|Migration Policy | MigrationPolicy | "High Availability" tab |
|Notes | Notes | "General" tab |
|Number Of Restart Attempts | NumberOfRestartAttempts | "High Availability" tab |
|Partial Cluster Stability Delay Seconds | PartialClusterStabilityDelaySeconds | "High Availability" tab |
|Preserve Message Properties | PreserveMsgProperty | "General" tab |
|Quality of Service Degradation Allowed | QosDegradationAllowed | "General" tab |
|Quality Of Service | QualityOfService | "General" tab |
|Rebalance Enabled | RebalanceEnabled | "High Availability" tab |
|Reconnect Delay Increase | ReconnectDelayIncrease | "Reconnect Parameters" tab |
|Reconnect Delay Maximum | ReconnectDelayMaximum | "Reconnect Parameters" tab |
|Reconnect Delay Minimum | ReconnectDelayMinimum | "Reconnect Parameters" tab |
|Restart In Place | RestartInPlace | "High Availability" tab |
|Seconds Between Restarts | SecondsBetweenRestarts | "High Availability" tab |
|Selector | Selector | "General" tab |
|Source Destination | SourceDestination | "General" tab |
|Started | Started | "General" tab |
|Targets | Target | "General" tab |
|Target Destination | TargetDestination | "General" tab |
|Transaction Timeout | TransactionTimeout | "Transaction Parameters" tab |

### MigratableTarget
Navigate to: Topology => Migratable Targets => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Additional Migration Attempts | AdditionalMigrationAttempts |  |
|Cluster | Cluster |  |
|Constrained Candidate Servers | ConstrainedCandidateServer |  |
|Critical | Critical |  |
|Migration Policy | MigrationPolicy |  |
|Milliseconds To Sleep Between Attempts | MillisToSleepBetweenAttempts |  |
|Non-Local Post-Deactivation Script Allowed | NonLocalPostAllowed |  |
|Notes | Notes |  |
|Number Of Restart Attempts | NumberOfRestartAttempts |  |
|Post-Deactivation Script | PostScript |  |
|Post-Deactivation Script Failure is Fatal | PostScriptFailureFatal |  |
|Pre-Migration Script | PreScript |  |
|Restart On Failure | RestartOnFailure |  |
|Seconds Between Restarts | SecondsBetweenRestarts |  |
|User Preferred Server | UserPreferredServer |  |

### NMProperties
Navigate to: Topology => NM Properties

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Authentication Enabled | AuthenticationEnabled | "General" tab |
|Cipher Suites | CipherSuites | "SSL Configuration" tab |
|Crash Recovery Enabled | CrashRecoveryEnabled | "General" tab => "Advanced" collapsible |
|Custom Identity Alias | CustomIdentityAlias | "SSL Configuration" tab |
|Custom Identity Keystore File Name | CustomIdentityKeyStoreFileName | "SSL Configuration" tab |
|Custom Identity Keystore Passphrase | CustomIdentityKeyStorePassPhrase | "SSL Configuration" tab |
|Custom Identity Keystore Type | CustomIdentityKeyStoreType | "SSL Configuration" tab |
|Custom Identity Private Key Passphrase | CustomIdentityPrivateKeyPassPhrase | "SSL Configuration" tab |
|Domain Keystores Domain | DomainKeystoresDomain | "SSL Configuration" tab |
|Domains Directory Remote Sharing Enabled | DomainsDirRemoteSharingEnabled | "General" tab => "Advanced" collapsible |
|Domains File | DomainsFile | "General" tab => "Advanced" collapsible |
|Domains File Enabled | DomainsFileEnabled | "General" tab => "Advanced" collapsible |
|Interface | Interface | "Network Configuration" tab |
|Interface Name | InterfaceName | "Network Configuration" tab |
|Java Standard Trust Keystore Passphrase | JavaStandardTrustKeyStorePassPhrase | "SSL Configuration" tab |
|Keystores | KeyStores | "SSL Configuration" tab |
|Listen Address | ListenAddress | "General" tab |
|Listen Backlog | ListenBacklog | "General" tab => "Advanced" collapsible |
|Listen Port | ListenPort | "General" tab |
|Log Append | LogAppend | "Logging" tab |
|Log Count | LogCount | "Logging" tab |
|Log File | LogFile | "Logging" tab |
|Log Formatter | LogFormatter | "Logging" tab |
|Log Level | LogLevel | "Logging" tab |
|Log Limit | LogLimit | "Logging" tab |
|Log To Stderr | LogToStderr | "Logging" tab |
|Native Version Enabled | NativeVersionEnabled | "General" tab |
|Net Mask | NetMask | "Network Configuration" tab |
|Node Manager Home | NodeManagerHome | "General" tab => "Advanced" collapsible |
|Quit Enabled | QuitEnabled | "General" tab => "Advanced" collapsible |
|Secure Listener | SecureListener | "General" tab |
|State Check Interval | StateCheckInterval | "General" tab => "Advanced" collapsible |
|Use KSS For Demo | UseKSSForDemo | "SSL Configuration" tab |
|WebLogic Home | WebLogicHome | "General" tab => "Advanced" collapsible |
|Coherence Start Script Enabled | coherence.StartScriptEnabled | "Start/Stop Scripts" tab => "Coherence Start Script Settings" section |
|Coherence Start Script Name | coherence.StartScriptName | "Start/Stop Scripts" tab => "Coherence Start Script Settings" section |
|WebLogic IfConfig Directory | weblogic.IfConfigDir | "Network Configuration" tab |
|WebLogic Start Script Enabled | weblogic.StartScriptEnabled | "Start/Stop Scripts" tab |
|WebLogic Start Script Name | weblogic.StartScriptName | "Start/Stop Scripts" tab |
|WebLogic Stop Script Enabled | weblogic.StopScriptEnabled | "Start/Stop Scripts" tab |
|WebLogic Stop Script Name | weblogic.StopScriptName | "Start/Stop Scripts" tab |
|WebLogic Use MAC Broadcast | weblogic.UseMACBroadcast | "Network Configuration" tab |

### ODLConfiguration
Navigate to: Resources => ODL Configurations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Servers | Servers |  |
|Add JVM Number | AddJvmNumber |  |
|Handler Defaults | HandlerDefaults |  |

### ODLConfiguration / Handler
Navigate to: Resources => ODL Configurations => (instance) => Handlers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class | Class |  |
|Encoding | Encoding |  |
|Error Manager | ErrorManager |  |
|Filter | Filter |  |
|Formatter | Formatter |  |
|Level | Level |  |
|Properties | Properties |  |

### ODLConfiguration / Logger
Navigate to: Resources => ODL Configurations => (instance) => Loggers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Filter | Filter |  |
|Handlers | Handlers |  |
|Level | Level |  |
|Use Parent Handlers | UseParentHandlers |  |

### OHS
Navigate to: Resources => OHS Configurations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Admin Host | AdminHost |  |
|Admin Port | AdminPort |  |
|Listen Address | ListenAddress |  |
|Listen Port | ListenPort |  |
|SSL Listen Port | SSLListenPort |  |
|Server Name | ServerName |  |

### OPSSInitialization
Navigate to: Domain Info => OPSS Initialization

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### OPSSInitialization / Credential
Navigate to: Domain Info => OPSS Initialization => Credentials => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### OPSSInitialization / Credential / TargetKey
Navigate to: Domain Info => OPSS Initialization => Credentials => (instance) => Target Keys => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Username | Username |  |
|Password | Password |  |

### PathService
Navigate to: Resources => Path Services => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Persistent Store | PersistentStore |  |
|Targets | Target |  |

### PluginDeployment
Navigate to: Deployments => Plug-in Deployments => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Plug-in Type | PluginType |  |
|Source Path | SourcePath |  |
|Staging Mode | StagingMode |  |

### RCUDbInfo
Navigate to: Domain Info => RCU DB Info

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Component Info XML Location | compInfoXMLLocation | "Advanced" collapsible |
|SSL Identity Keystore | javax.net.ssl.keyStore | "Stores" section |
|SSL Identity Keystore Type | javax.net.ssl.keyStoreType | "Stores" section |
|SSL Identity Keystore Passphrase | javax.net.ssl.keyStorePassword | "Stores" section |
|SSL Trust Keystore | javax.net.ssl.trustStore | "Stores" section |
|SSL Trust Keystore Type | javax.net.ssl.trustStoreType | "Stores" section |
|SSL Trust Keystore Passphrase | javax.net.ssl.trustStorePassword | "Stores" section |
|Oracle Database Admin Role | oracle_database_admin_role | "Connection" section |
|Database Connection Type | oracle_database_connection_type | "Connection" section |
|TNS Admin Directory | oracle.net.tns_admin | "Connection" section |
|Database Admin Password | rcu_admin_password | "Connection" section |
|Database Admin User | rcu_admin_user | "Connection" section |
|RCU Database Type | rcu_database_type | "Connection" section |
|RCU Database Connection String | rcu_db_conn_string | "Connection" section |
|RCU Edition | rcu_edition | "Advanced" collapsible |
|RCU Prefix | rcu_prefix | "Connection" section |
|Schema Password | rcu_schema_password | "Connection" section |
|Default Tablespace | rcu_default_tablespace | "Advanced" collapsible |
|Temp Tablespace | rcu_temp_tablespace | "Advanced" collapsible |
|Unicode Support | rcu_unicode_support | "Advanced" collapsible |
|TNS Alias | tns.alias | "Connection" section |
|RCU Variables | rcu_variables | "Advanced" collapsible |
|Storage Info XML Location | storageXMLLocation | "Advanced" collapsible |

### RemoteConsoleHelper
Navigate to: Topology => Remote Console Helper

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Context Path | ContextPath |  |
|Cookie Name | CookieName |  |
|Notes | Notes |  |
|Protected Cookie Enabled | ProtectedCookieEnabled |  |
|Session Timeout | SessionTimeout |  |
|Token Timeout | TokenTimeout |  |

### RestfulManagementServices
Navigate to: Topology => Restful Management Services

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|CORS Allowed Credentials | CorsAllowedCredentials |  |
|CORS Allowed Headers | CorsAllowedHeaders |  |
|CORS Allowed Methods | CorsAllowedMethods |  |
|CORS Allowed Origins | CorsAllowedOrigin |  |
|CORS Enabled | CorsEnabled |  |
|CORS Exposed Headers | CorsExposedHeaders |  |
|CORS Max Age | CorsMaxAge |  |
|Delegated Request Connect Timeout Milliseconds | DelegatedRequestConnectTimeoutMillis |  |
|Delegated Request Max Wait Milliseconds | DelegatedRequestMaxWaitMillis |  |
|Delegated Request Min Threads | DelegatedRequestMinThreads |  |
|Delegated Request Read Timeout Milliseconds | DelegatedRequestReadTimeoutMillis |  |
|Enabled | Enabled |  |
|Fanned Out Request Max Wait Millis | FannedOutRequestMaxWaitMillis |  |
|Java Service Resources Enabled | JavaServiceResourcesEnabled |  |
|Notes | Notes |  |

### RmiForwarding
Navigate to: Topology => RMI Forwarding => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|URL | Url |  |

### RmiForwarding / ConfigurationProperty
Navigate to: Topology => RMI Forwarding => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### SAFAgent
Navigate to: Resources => SAF Agents => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Acknowledge Interval | AcknowledgeInterval | "General" tab => "Advanced" collapsible |
|Bytes Maximum | BytesMaximum | "Quotas" tab |
|Bytes Threshold High | BytesThresholdHigh | "Thresholds" tab |
|Bytes Threshold Low | BytesThresholdLow | "Thresholds" tab |
|Conversation Idle Time Maximum | ConversationIdleTimeMaximum | "General" tab |
|Default Retry Delay Base | DefaultRetryDelayBase | "General" tab => "Advanced" collapsible |
|Default Retry Delay Maximum | DefaultRetryDelayMaximum | "General" tab => "Advanced" collapsible |
|Default Retry Delay Multiplier | DefaultRetryDelayMultiplier | "General" tab => "Advanced" collapsible |
|Default Time-to-Live | DefaultTimeToLive | "General" tab => "Advanced" collapsible |
|Deployment Order | DeploymentOrder | "General" tab |
|Forwarding Paused At Startup | ForwardingPausedAtStartup | "General" tab => "Advanced" collapsible |
|Incoming Paused At Startup | IncomingPausedAtStartup | "General" tab => "Advanced" collapsible |
|Logging Enabled | LoggingEnabled | "General" tab |
|Maximum Message Size | MaximumMessageSize | "Quotas" tab |
|Message Buffer Size | MessageBufferSize | "General" tab => "Advanced" collapsible |
|Message Compression Options | MessageCompressionOptions | "General" tab => "Advanced" collapsible |
|Messages Maximum | MessagesMaximum | "Quotas" tab |
|Messages Threshold High | MessagesThresholdHigh | "Thresholds" tab |
|Messages Threshold Low | MessagesThresholdLow | "Thresholds" tab |
|Notes | Notes | "General" tab |
|Paging Directory | PagingDirectory | "General" tab => "Advanced" collapsible |
|Paging Message Compression Enabled | PagingMessageCompressionEnabled | "General" tab => "Advanced" collapsible |
|Receiving Paused At Startup | ReceivingPausedAtStartup | "General" tab => "Advanced" collapsible |
|Service Type | ServiceType | "General" tab |
|Persistent Store | Store | "General" tab |
|Store Message Compression Enabled | StoreMessageCompressionEnabled | "General" tab => "Advanced" collapsible |
|Targets | Target | "General" tab |
|Window Interval | WindowInterval | "General" tab => "Advanced" collapsible |
|Window Size | WindowSize | "General" tab => "Advanced" collapsible |

### SAFAgent / JmssafMessageLogFile
Navigate to: Resources => SAF Agents => (instance) => JMS SAF Message Log File

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb |  |
|Date Format Pattern | DateFormatPattern |  |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Rotation Directory | LogFileRotationDir |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### SNMPAgent
Navigate to: Resources => SNMP Agent

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Authentication Protocol | AuthenticationProtocol |  |
|Community-Based Access Enabled | CommunityBasedAccessEnabled |  |
|Community Prefix | CommunityPrefix |  |
|Enabled | Enabled |  |
|Inform Enabled | InformEnabled |  |
|Inform Retry Interval | InformRetryInterval |  |
|Listen Address | ListenAddress |  |
|Localized Key Cache Invalidation Interval | LocalizedKeyCacheInvalidationInterval |  |
|Master AgentX Port | MasterAgentXPort |  |
|Max Inform Retry Count | MaxInformRetryCount |  |
|Notes | Notes |  |
|Privacy Protocol | PrivacyProtocol |  |
|SNMP Port | SNMPPort |  |
|SNMP Trap Version | SNMPTrapVersion |  |
|Send Automatic Traps Enabled | SendAutomaticTrapsEnabled |  |
|SNMP Access For User MBeans Enabled | SnmpAccessForUserMBeansEnabled |  |
|SNMP Engine ID | SnmpEngineId |  |

### SNMPAgent / SNMPAttributeChange
Navigate to: Resources => SNMP Agent => SNMP Attribute Changes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attribute MBean Name | AttributeMBeanName |  |
|Attribute MBean Type | AttributeMBeanType |  |
|Attribute Name | AttributeName |  |
|Enabled Servers | EnabledServer |  |
|Notes | Notes |  |

### SNMPAgent / SNMPCounterMonitor
Navigate to: Resources => SNMP Agent => SNMP Counter Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Modulus | Modulus |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Offset | Offset |  |
|Polling Interval | PollingInterval |  |
|Threshold | Threshold |  |

### SNMPAgent / SNMPGaugeMonitor
Navigate to: Resources => SNMP Agent => SNMP Gauge Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Polling Interval | PollingInterval |  |
|Threshold High | ThresholdHigh |  |
|Threshold Low | ThresholdLow |  |

### SNMPAgent / SNMPLogFilter
Navigate to: Resources => SNMP Agent => SNMP Log Filters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Message IDs | MessageId |  |
|Message Substring | MessageSubstring |  |
|Notes | Notes |  |
|Severity Level | SeverityLevel |  |
|Subsystem Names | SubsystemName |  |
|User IDs | UserId |  |

### SNMPAgent / SNMPProxy
Navigate to: Resources => SNMP Agent => SNMP Proxies => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Community | Community |  |
|Listen Address | ListenAddress |  |
|Notes | Notes |  |
|OID Root | OidRoot |  |
|Port | Port |  |
|Security Level | SecurityLevel |  |
|Security Name | SecurityName |  |
|Timeout | Timeout |  |

### SNMPAgent / SNMPStringMonitor
Navigate to: Resources => SNMP Agent => SNMP String Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Notify Differ | NotifyDiffer |  |
|Notify Match | NotifyMatch |  |
|Polling Interval | PollingInterval |  |
|String To Compare | StringToCompare |  |

### SNMPAgent / SNMPTrapDestination
Navigate to: Resources => SNMP Agent => SNMP Trap Destinations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Community | Community |  |
|Host | Host |  |
|Notes | Notes |  |
|Port | Port |  |
|Security Level | SecurityLevel |  |
|Security Name | SecurityName |  |

### SecurityConfiguration
Navigate to: Topology => Security Configuration

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Administrative Identity Domain | AdministrativeIdentityDomain |  |
|Boot Authentication Max Retry Delay | BootAuthenticationMaxRetryDelay | "Advanced" collapsible => "Boot Authentication Retries" section |
|Boot Authentication Retry Count | BootAuthenticationRetryCount | "Advanced" collapsible => "Boot Authentication Retries" section |
|Check Certificates Expiration Days | CheckCertificatesExpirationDays | "Advanced" collapsible => "Check Certificates Settings" section |
|Check Certificates Interval Days | CheckCertificatesIntervalDays | "Advanced" collapsible => "Check Certificates Settings" section |
|Check Identity Certificates | CheckIdentityCertificates | "Advanced" collapsible => "Check Certificates Settings" section |
|Check Trust Certificates | CheckTrustCertificates | "Advanced" collapsible => "Check Certificates Settings" section |
|Clear Text Credential Access Enabled | ClearTextCredentialAccessEnabled | "Advanced" collapsible => "Miscellaneous" section |
|Compatibility Connection Filters Enabled | CompatibilityConnectionFiltersEnabled | "Advanced" collapsible => "Connection Filter Settings" section |
|Connection Filter | ConnectionFilter | "Advanced" collapsible => "Connection Filter Settings" section |
|Connection Filter Ignore Rule Errors Enabled | ConnectionFilterIgnoreRuleErrorsEnabled | "Advanced" collapsible => "Connection Filter Settings" section |
|Connection Filter Rules | ConnectionFilterRule | "Advanced" collapsible => "Connection Filter Settings" section |
|Connection Logger Enabled | ConnectionLoggerEnabled | "Advanced" collapsible => "Connection Filter Settings" section |
|Console Full Delegation Enabled | ConsoleFullDelegationEnabled | "Advanced" collapsible => "Miscellaneous" section |
|Credential | CredentialEncrypted |  |
|Cross Domain Security Enabled | CrossDomainSecurityEnabled |  |
|Cross Domain Security Cache Enabled | CrossDomainSecurityCacheEnabled | "Advanced" collapsible => "Cross Domain Security Cache" section |
|Cross Domain Security Cache TTL | CrossDomainSecurityCacheTtl | "Advanced" collapsible => "Cross Domain Security Cache" section |
|Default Realm | DefaultRealm |  |
|Downgrade Untrusted Principals | DowngradeUntrustedPrincipals | "Advanced" collapsible => "Principal Settings" section |
|Enforce Strict URL Pattern | EnforceStrictURLPattern | "Advanced" collapsible => "Web App Settings" section |
|Enforce Valid Basic Auth Credentials | EnforceValidBasicAuthCredentials | "Advanced" collapsible => "Web App Settings" section |
|Excluded Domain Names | ExcludedDomainName |  |
|Identity Domain Aware Providers Required | IdentityDomainAwareProvidersRequired |  |
|Identity Domain Default Enabled | IdentityDomainDefaultEnabled |  |
|Node Manager Password | NodeManagerPasswordEncrypted |  |
|Node Manager Username | NodeManagerUsername |  |
|Nonce Timeout Seconds | NonceTimeoutSeconds | "Advanced" collapsible => "Miscellaneous" section |
|Notes | Notes |  |
|Outbound Reference Host Allow List | OutboundReferenceHostAllowList | "Advanced" collapsible => "Miscellaneous" section |
|Principal Equals Case Insensitive | PrincipalEqualsCaseInsensitive | "Advanced" collapsible => "Principal Settings" section |
|Principal Equals Compare DN and GUID | PrincipalEqualsCompareDnAndGuid | "Advanced" collapsible => "Principal Settings" section |
|Remote Anonymous JNDI Enabled | RemoteAnonymousJndiEnabled | "Advanced" collapsible => "Anonymous Access" section |
|Remote Anonymous RMI/IIOP Enabled | RemoteAnonymousRmiiiopEnabled | "Advanced" collapsible => "Anonymous Access" section |
|Remote Anonymous RMI/T3 Enabled | RemoteAnonymousRmit3Enabled | "Advanced" collapsible => "Anonymous Access" section |
|Two-Way TLS Required For Admin Clients | TwoWayTLSRequiredForAdminClients | "Advanced" collapsible => "Miscellaneous" section |
|Use KSS For Demo | UseKSSForDemo | "Advanced" collapsible => "Miscellaneous" section |
|Web App Files Case Insensitive | WebAppFilesCaseInsensitive | "Advanced" collapsible => "Web App Settings" section |

### SecurityConfiguration / CertRevoc
Navigate to: Topology => Security Configuration => Certificate Revocation

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Checking Enabled | CheckingEnabled |  |
|CRL Cache Refresh Period Percent | CrlCacheRefreshPeriodPercent | "Certificate Revocation List (CRL) Cache" section |
|CRL Cache Type | CrlCacheType | "Certificate Revocation List (CRL) Cache" section |
|CRL Cache Type LDAP Hostname | CrlCacheTypeLdapHostname | "Certificate Revocation List (CRL) Cache" section |
|CRL Cache Type LDAP Port | CrlCacheTypeLdapPort | "Certificate Revocation List (CRL) Cache" section |
|CRL Cache Type LDAP Search Timeout | CrlCacheTypeLdapSearchTimeout | "Certificate Revocation List (CRL) Cache" section |
|CRL Distribution Point Background Download Enabled | CrlDpBackgroundDownloadEnabled | "Certificate Revocation List (CRL) Cache" section |
|CRL Distribution Point Download Timeout | CrlDpDownloadTimeout | "Certificate Revocation List (CRL) Cache" section |
|CRL Distribution Point Enabled | CrlDpEnabled | "Certificate Revocation List (CRL) Cache" section |
|Fail On Unknown Revocation Status | FailOnUnknownRevocStatus |  |
|Method Order | MethodOrder |  |
|Notes | Notes |  |
|OCSP Nonce Enabled | OcspNonceEnabled | "Online Certificate Status Protocol (OCSP) Settings" section |
|OCSP Response Cache Capacity | OcspResponseCacheCapacity | "Online Certificate Status Protocol (OCSP) Settings" section |
|OCSP Response Cache Enabled | OcspResponseCacheEnabled | "Online Certificate Status Protocol (OCSP) Settings" section |
|OCSP Response Cache Refresh Period Percent | OcspResponseCacheRefreshPeriodPercent | "Online Certificate Status Protocol (OCSP) Settings" section |
|OCSP Response Timeout | OcspResponseTimeout | "Online Certificate Status Protocol (OCSP) Settings" section |
|OCSP Time Tolerance | OcspTimeTolerance | "Online Certificate Status Protocol (OCSP) Settings" section |

### SecurityConfiguration / CertRevoc / CertRevocCa
Navigate to: Topology => Security Configuration => Certificate Revocation => Certificate Revocation for CAs => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Checking Disabled | CheckingDisabled |  |
|CRL Distribution Point Background Download Enabled | CrlDpBackgroundDownloadEnabled | "Certificate Authority CRL Distribution Point Settings" section |
|CRL Distribution Point Download Timeout | CrlDpDownloadTimeout | "Certificate Authority CRL Distribution Point Settings" section |
|CRL Distribution Point Enabled | CrlDpEnabled | "Certificate Authority CRL Distribution Point Settings" section |
|CRL Distribution Point URL | CrlDpUrl | "Certificate Authority CRL Distribution Point Settings" section |
|CRL Distribution Point URL Usage | CrlDpUrlUsage | "Certificate Authority CRL Distribution Point Settings" section |
|Distinguished Name | DistinguishedName |  |
|Fail On Unknown Revocation Status | FailOnUnknownRevocStatus |  |
|Method Order | MethodOrder |  |
|Notes | Notes |  |
|OCSP Nonce Enabled | OcspNonceEnabled | "Certificate Authority OCSP Settings" section |
|OCSP Responder Certificate Issuer Name | OcspResponderCertIssuerName | "Certificate Authority OCSP Settings" section |
|OCSP Responder Certificate Serial Number | OcspResponderCertSerialNumber | "Certificate Authority OCSP Settings" section |
|OCSP Responder Certificate Subject Name | OcspResponderCertSubjectName | "Certificate Authority OCSP Settings" section |
|OCSP Responder Explicit Trust Method | OcspResponderExplicitTrustMethod | "Certificate Authority OCSP Settings" section |
|OCSP Responder URL | OcspResponderUrl | "Certificate Authority OCSP Settings" section |
|OCSP Responder URL Usage | OcspResponderUrlUsage | "Certificate Authority OCSP Settings" section |
|OCSP Response Cache Enabled | OcspResponseCacheEnabled | "Certificate Authority OCSP Settings" section |
|OCSP Response Timeout | OcspResponseTimeout | "Certificate Authority OCSP Settings" section |
|OCSP Time Tolerance | OcspTimeTolerance | "Certificate Authority OCSP Settings" section |

### SecurityConfiguration / CertificateManagement
Navigate to: Topology => Security Configuration => Certificate Management

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Certificate Authority Validity Period | CertificateAuthorityValidityPeriod |  |
|Certificate Check Interval | CertificateCheckInterval |  |
|Certificate Refresh Window | CertificateRefreshWindow |  |
|Certificate Validity Period | CertificateValidityPeriod |  |
|Enabled | Enabled |  |
|Include Root Certificate In Chain | IncludeRootCertificateInChain |  |
|Java Standard Trust Enabled | JavaStandardTrustEnabled |  |
|Notes | Notes |  |
|Provisioned Certificates Issuer Enabled | ProvisionedCertificatesIssuerEnabled |  |
|Single Purpose Certificates Enabled | SinglePurposeCertificatesEnabled |  |
|Subject Alternative Names | SubjectAlternativeNames |  |
|Subject Common Name | SubjectCommonName |  |

### SecurityConfiguration / CertificateManagement / CertificateIssuerPlugin
Navigate to: Topology => Security Configuration => Certificate Management => Certificate Issuer Plug-ins => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Certificate Request Properties | CertificateRequestProperties |  |
|Credential Set | CredentialSet |  |
|Deployment | Deployment |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Properties | Properties |  |

### SecurityConfiguration / CertificateManagement / ConfigurationProperty
Navigate to: Topology => Security Configuration => Certificate Management => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### SecurityConfiguration / CredentialSet
Navigate to: Topology => Security Configuration => Credential Sets => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |

### SecurityConfiguration / CredentialSet / EncryptedProperty
Navigate to: Topology => Security Configuration => Credential Sets => (instance) => Encrypted Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Value | EncryptedValueEncrypted |  |

### SecurityConfiguration / Realm
Navigate to: Topology => Security Configuration => Realms => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Authentication Methods | AuthMethods |  |
|Auto Restart On Non Dynamic Changes | AutoRestartOnNonDynamicChanges |  |
|Certificate Path Builder | CertPathBuilder |  |
|Combined Role Mapping Enabled | CombinedRoleMappingEnabled |  |
|Delegate MBean Authorization | DelegateMBeanAuthorization |  |
|Deployable Provider Synchronization Enabled | DeployableProviderSynchronizationEnabled |  |
|Deployable Provider Synchronization Timeout | DeployableProviderSynchronizationTimeout |  |
|Enable WebLogic Principal Validator Cache | EnableWebLogicPrincipalValidatorCache |  |
|Identity Assertion Cache Enabled | IdentityAssertionCacheEnabled |  |
|Identity Assertion Cache TTL | IdentityAssertionCacheTtl |  |
|Identity Assertion Do Not Cache Context Elements | IdentityAssertionDoNotCacheContextElement |  |
|Identity Assertion Header Names Precedence | IdentityAssertionHeaderNamePrecedence |  |
|Management Identity Domain | ManagementIdentityDomain |  |
|Max WebLogic Principals In Cache | MaxWebLogicPrincipalsInCache |  |
|Retire Timeout Seconds | RetireTimeoutSeconds |  |
|Security Deployment Descriptor Model | SecurityDDModel |  |
|WebLogic JWT Virtual User Enabled | WebLogicJwtVirtualUserEnabled |  |

### SecurityConfiguration / Realm / Adjudicator / DefaultAdjudicator
Navigate to: Topology => Security Configuration => Realms => (instance) => Adjudicators => (instance of type DefaultAdjudicator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Require Unanimous Permit | RequireUnanimousPermit |  |

### SecurityConfiguration / Realm / Auditor / DefaultAuditor
Navigate to: Topology => Security Configuration => Realms => (instance) => Auditors => (instance of type DefaultAuditor)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Context Handler Entries | ActiveContextHandlerEntry |  |
|Begin Marker | BeginMarker |  |
|End Marker | EndMarker |  |
|Error Audit Severity Enabled | ErrorAuditSeverityEnabled |  |
|Failure Audit Severity Enabled | FailureAuditSeverityEnabled |  |
|Field Prefix | FieldPrefix |  |
|Field Suffix | FieldSuffix |  |
|Information Audit Severity Enabled | InformationAuditSeverityEnabled |  |
|Number Of Files Limit | NumberOfFilesLimit |  |
|Rotation Minutes | RotationMinutes |  |
|Rotation Size | RotationSize |  |
|Rotation Type | RotationType |  |
|Severity | Severity |  |
|Success Audit Severity Enabled | SuccessAuditSeverityEnabled |  |
|Warning Audit Severity Enabled | WarningAuditSeverityEnabled |  |

### SecurityConfiguration / Realm / AuthenticationProvider / ActiveDirectoryAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type ActiveDirectoryAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Enable SID-to-Group Lookup Caching | EnableSIDtoGroupLookupCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Max SID-to-Group Lookups In Cache | MaxSIDToGroupLookupsInCache | "Caching" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|Retrieve User Account Control | RetrieveUserAccountControl | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|Use Token Groups For Group Membership Lookup | UseTokenGroupsForGroupMembershipLookup | "Groups" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / CustomDBMSAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type CustomDBMSAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag |  |
|Data Source Name | DataSourceName |  |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching |  |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL |  |
|Group Membership Searching | GroupMembershipSearching |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Legacy Argon2 Fallback Enabled | LegacyArgon2FallbackEnabled | "Advanced" collapsible |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache |  |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel |  |
|Plaintext Passwords Enabled | PlaintextPasswordsEnabled | "Advanced" collapsible |
|Plug-in Class Name | PluginClassName |  |
|Plug-in Properties | PluginProperties |  |

### SecurityConfiguration / Realm / AuthenticationProvider / DefaultAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type DefaultAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag |  |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching |  |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL |  |
|Group Membership Searching | GroupMembershipSearching |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Identity Domains | IdentityDomains | "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled |  |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache |  |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel |  |
|Minimum Password Length | MinimumPasswordLength |  |
|Name Callback Allowed | NameCallbackAllowed |  |
|Password Digest Enabled | PasswordDigestEnabled | "Advanced" collapsible |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "Advanced" collapsible |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal |  |

### SecurityConfiguration / Realm / AuthenticationProvider / DefaultIdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type DefaultIdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Types | ActiveType |  |
|Base64 Decoding Required | Base64DecodingRequired |  |
|Base64 Encoding Exceptions | Base64EncodingException |  |
|Default User Name Mapper Attribute Delimiter | DefaultUserNameMapperAttributeDelimiter |  |
|Default User Name Mapper Attribute Type | DefaultUserNameMapperAttributeType |  |
|Digest Data Source Name | DigestDataSourceName |  |
|Digest Expiration Time Period | DigestExpirationTimePeriod |  |
|Digest Replay Detection Enabled | DigestReplayDetectionEnabled |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Trusted Client Principals | TrustedClientPrincipal |  |
|Use Default User Name Mapper | UseDefaultUserNameMapper |  |
|User Name Mapper Class Name | UserNameMapperClassName |  |
|Virtual User Allowed | VirtualUserAllowed |  |

### SecurityConfiguration / Realm / AuthenticationProvider / IPlanetAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type IPlanetAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group From User Filter For Member UID | GroupFromUserFilterForMemberuid | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Member UID For Group Search | UseMemberuidForGroupSearch | "Groups" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / LDAPAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type LDAPAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / LDAPX509IdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type LDAPX509IdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Types | ActiveType | "General" tab |
|Base64 Decoding Required | Base64DecodingRequired | "General" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "LDAP Settings" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Certificate Attribute | CertificateAttribute | "General" tab |
|Certificate Mapping | CertificateMapping | "General" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Credential | CredentialEncrypted | "LDAP Settings" tab |
|Follow Referrals | FollowReferrals | "LDAP Settings" tab |
|Host | Host | "LDAP Settings" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "LDAP Settings" tab |
|Principal | Principal | "LDAP Settings" tab |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|SSL Enabled | SSLEnabled | "LDAP Settings" tab |
|User Filter Attributes | UserFilterAttribute | "General" tab |
|Username Attribute | UsernameAttribute | "General" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / NegotiateIdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type NegotiateIdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Types | ActiveType |  |
|Base64 Decoding Required | Base64DecodingRequired |  |
|Form Based Negotiation Enabled | FormBasedNegotiationEnabled |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |

### SecurityConfiguration / Realm / AuthenticationProvider / NovellAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type NovellAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / OIDCIdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type OIDCIdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Types | ActiveType |  |
|Base64 Decoding Required | Base64DecodingRequired |  |
|Clock Skew | ClockSkew |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Key Cache Size | KeyCacheSize |  |
|Key Cache TTL | KeyCacheTtl |  |
|Request Cache Size | RequestCacheSize |  |
|Request Cache TTL | RequestCacheTtl |  |
|User ID Token Claim | UserIdTokenClaim |  |
|User Name Token Claim | UserNameTokenClaim |  |
|Virtual User Allowed | VirtualUserAllowed |  |

### SecurityConfiguration / Realm / AuthenticationProvider / OpenLDAPAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type OpenLDAPAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / OracleInternetDirectoryAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type OracleInternetDirectoryAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Check User Enabled Attribute | CheckUserEnabledAttribute | "Users" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / OracleUnifiedDirectoryAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type OracleUnifiedDirectoryAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group From User Filter For Member UID | GroupFromUserFilterForMemberuid | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Member UID For Group Search | UseMemberuidForGroupSearch | "Groups" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / OracleVirtualDirectoryAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type OracleVirtualDirectoryAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|All Groups Filter | AllGroupsFilter | "Groups" tab |
|All Users Filter | AllUsersFilter | "Users" tab |
|Bind Anonymously On Referrals | BindAnonymouslyOnReferrals | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Connection Pool Size | ConnectionPoolSize | "Tuning Parameters" tab |
|Connection Retry Limit | ConnectionRetryLimit | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Credential | CredentialEncrypted | "General" tab |
|Dynamic Group Name Attribute | DynamicGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Dynamic Group Object Class | DynamicGroupObjectClass | "Static/Dynamic Bindings" tab |
|Dynamic Member URL Attribute | DynamicMemberUrlAttribute | "Static/Dynamic Bindings" tab |
|Enable Cache Statistics | EnableCacheStatistics | "Caching" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "Caching" tab |
|Follow Referrals | FollowReferrals | "General" tab |
|Group Base DN | GroupBaseDN | "Groups" tab |
|Group From Name Filter | GroupFromNameFilter | "Groups" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "Caching" tab |
|Group Membership Searching | GroupMembershipSearching | "Groups" tab |
|Group Search Scope | GroupSearchScope | "Groups" tab |
|GUID Attribute | GuidAttribute | "Users" tab |
|Host | Host | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Ignore Duplicate Membership | IgnoreDuplicateMembership | "General" tab => "Advanced" collapsible |
|Keep Alive Enabled | KeepAliveEnabled | "Tuning Parameters" tab |
|Match Group Base DN | MatchGroupBaseDn | "Groups" tab |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "Caching" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "Groups" tab |
|Parallel Connect Delay | ParallelConnectDelay | "Tuning Parameters" tab |
|Port | Port | "General" tab |
|Principal | Principal | "General" tab |
|Propagate Cause For Login Exception | PropagateCauseForLoginException | "General" tab => "Advanced" collapsible |
|Results Time Limit | ResultsTimeLimit | "Tuning Parameters" tab |
|Retrieve Principal From User DN | RetrievePrincipalFromUserDn | "Users" tab |
|SSL Enabled | SSLEnabled | "General" tab |
|Static Group DNs from Member DN Filter | StaticGroupDNsfromMemberDNFilter | "Static/Dynamic Bindings" tab |
|Static Group Name Attribute | StaticGroupNameAttribute | "Static/Dynamic Bindings" tab |
|Static Group Object Class | StaticGroupObjectClass | "Static/Dynamic Bindings" tab |
|Static Member DN Attribute | StaticMemberDNAttribute | "Static/Dynamic Bindings" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "Users" tab |
|User Base DN | UserBaseDn | "Users" tab |
|User Description Attribute | UserDescriptionAttribute | "Users" tab |
|User Dynamic Group DN Attribute | UserDynamicGroupDnAttribute | "Static/Dynamic Bindings" tab |
|User From Name Filter | UserFromNameFilter | "Users" tab |
|User Name Attribute | UserNameAttribute | "Users" tab |
|User Object Class | UserObjectClass | "Users" tab |
|User Search Scope | UserSearchScope | "Users" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / ReadOnlySQLAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type ReadOnlySQLAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag | "General" tab |
|Data Source Name | DataSourceName | "General" tab |
|Descriptions Supported | DescriptionsSupported | "SQL" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "General" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "General" tab |
|Group Membership Searching | GroupMembershipSearching | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Legacy Argon2 Fallback Enabled | LegacyArgon2FallbackEnabled | "General" tab => "Advanced" collapsible |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "General" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "General" tab |
|Plaintext Passwords Enabled | PlaintextPasswordsEnabled | "General" tab => "Advanced" collapsible |
|SQL Get Group Description | SQLGetGroupDescription | "SQL" tab |
|SQL Get User Description | SQLGetUserDescription | "SQL" tab |
|SQL Get Users Password | SQLGetUsersPassword | "SQL" tab |
|SQL Group Exists | SQLGroupExists | "SQL" tab |
|SQL Is Member | SQLIsMember | "SQL" tab |
|SQL List Groups | SQLListGroups | "SQL" tab |
|SQL List Member Groups | SQLListMemberGroups | "SQL" tab |
|SQL List Users | SQLListUsers | "SQL" tab |
|SQL User Exists | SQLUserExists | "SQL" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / SAML2IdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type SAML2IdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Base64 Decoding Required | Base64DecodingRequired |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Login Token Association Enabled | LoginTokenAssociatonEnabled |  |
|Name Mapper Class Name | NameMapperClassName |  |
|Replicated Cache Enabled | ReplicatedCacheEnabled |  |

### SecurityConfiguration / Realm / AuthenticationProvider / SAMLAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type SAMLAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |

### SecurityConfiguration / Realm / AuthenticationProvider / SAMLIdentityAsserterV2
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type SAMLIdentityAsserterV2)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Base64 Decoding Required | Base64DecodingRequired |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Minimum Parser Pool Size | MinimumParserPoolSize |  |
|Name Mapper Class Name | NameMapperClassName |  |

### SecurityConfiguration / Realm / AuthenticationProvider / SQLAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type SQLAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag | "General" tab |
|Data Source Name | DataSourceName | "General" tab |
|Descriptions Supported | DescriptionsSupported | "SQL" tab |
|Enable Group Membership Lookup Hierarchy Caching | EnableGroupMembershipLookupHierarchyCaching | "General" tab |
|Group Hierarchy Cache Time-to-Live | GroupHierarchyCacheTTL | "General" tab |
|Group Membership Searching | GroupMembershipSearching | "General" tab |
|Identity Domain | IdentityDomain | "General" tab => "Advanced" collapsible |
|Legacy Argon2 Fallback Enabled | LegacyArgon2FallbackEnabled | "General" tab => "Advanced" collapsible |
|Max Group Hierarchies In Cache | MaxGroupHierarchiesInCache | "General" tab |
|Max Group Membership Search Level | MaxGroupMembershipSearchLevel | "General" tab |
|Password Algorithm | PasswordAlgorithm | "General" tab => "Advanced" collapsible |
|Password Style | PasswordStyle | "General" tab => "Advanced" collapsible |
|Password Style Retained | PasswordStyleRetained | "General" tab => "Advanced" collapsible |
|Plaintext Passwords Enabled | PlaintextPasswordsEnabled | "General" tab => "Advanced" collapsible |
|SQL Add Member To Group | SQLAddMemberToGroup | "SQL" tab |
|SQL Create Group | SQLCreateGroup | "SQL" tab |
|SQL Create User | SQLCreateUser | "SQL" tab |
|SQL Get Group Description | SQLGetGroupDescription | "SQL" tab |
|SQL Get User Description | SQLGetUserDescription | "SQL" tab |
|SQL Get Users Password | SQLGetUsersPassword | "SQL" tab |
|SQL Group Exists | SQLGroupExists | "SQL" tab |
|SQL Is Member | SQLIsMember | "SQL" tab |
|SQL List Group Members | SQLListGroupMembers | "SQL" tab |
|SQL List Groups | SQLListGroups | "SQL" tab |
|SQL List Member Groups | SQLListMemberGroups | "SQL" tab |
|SQL List Users | SQLListUsers | "SQL" tab |
|SQL Remove Group | SQLRemoveGroup | "SQL" tab |
|SQL Remove Group Member | SQLRemoveGroupMember | "SQL" tab |
|SQL Remove Group Memberships | SQLRemoveGroupMemberships | "SQL" tab |
|SQL Remove Member From Group | SQLRemoveMemberFromGroup | "SQL" tab |
|SQL Remove User | SQLRemoveUser | "SQL" tab |
|SQL Set Group Description | SQLSetGroupDescription | "SQL" tab |
|SQL Set User Description | SQLSetUserDescription | "SQL" tab |
|SQL Set User Password | SQLSetUserPassword | "SQL" tab |
|SQL User Exists | SQLUserExists | "SQL" tab |

### SecurityConfiguration / Realm / AuthenticationProvider / TrustServiceIdentityAsserter
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type TrustServiceIdentityAsserter)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Active Types | ActiveType |  |

### SecurityConfiguration / Realm / AuthenticationProvider / VirtualUserAuthenticator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type VirtualUserAuthenticator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Control Flag | ControlFlag |  |
|Identity Domain | IdentityDomain | "Advanced" collapsible |
|Identity Domains | IdentityDomains | "Advanced" collapsible |

### SecurityConfiguration / Realm / AuthenticationProvider / weblogic.security.providers.authentication.OracleIdentityCloudIntegrator
Navigate to: Topology => Security Configuration => Realms => (instance) => Authentication Providers => (instance of type weblogic.security.providers.authentication.OracleIdentityCloudIntegrator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Access Token Context Paths | AccessTokenContextPath | "General" tab => "Advanced" collapsible |
|Access Token Timeout Window | AccessTokenTimeoutWindow | "Tuning Parameters" tab |
|Active Types | ActiveType | "Identity Asserter Configuration" tab |
|Alt Client ID Token Claim | AltClientIdTokenClaim | "General" tab => "Advanced" collapsible |
|Alt ID Token Claim | AltIdTokenClaim | "General" tab => "Advanced" collapsible |
|Any Identity Domain Enabled | AnyIdentityDomainEnabled | "General" tab |
|App Name Filter Header Name | AppNameFilterHeaderName | "General" tab |
|App Roles Token Claim | AppRolesTokenClaim | "Identity Asserter Configuration" tab |
|Audience Enabled | AudienceEnabled | "Authorization Bearer" tab |
|Base Path | BasePath | "General" tab |
|Cache Enabled | CacheEnabled | "Caching" tab |
|Cache Size | CacheSize | "Caching" tab |
|Cache Time-to-Live | CacheTtl | "Caching" tab |
|Client As User Principal Enabled | ClientAsUserPrincipalEnabled | "Authorization Bearer" tab |
|Client ID | ClientId | "General" tab |
|Client ID Resource Attribute | ClientIdResourceAttribute | "Authorization Bearer" tab |
|Client ID Token Claim | ClientIdTokenClaim | "Authorization Bearer" tab |
|Client Name Token Claim | ClientNameTokenClaim | "Authorization Bearer" tab |
|Client Secret | ClientSecretEncrypted | "General" tab |
|Client Tenant | ClientTenant | "General" tab |
|Client Tenant Token Claim | ClientTenantTokenClaim | "Authorization Bearer" tab |
|Connect Timeout | ConnectTimeout | "Tuning Parameters" tab |
|Control Flag | ControlFlag | "General" tab |
|Groups Token Claim | GroupsTokenClaim | "Identity Asserter Configuration" tab |
|Host | Host | "General" tab |
|Issuer | Issuer | "Identity Asserter Configuration" tab |
|JSON Web Key Set URI | JsonWebKeySetUri | "Identity Asserter Configuration" tab |
|Known Tenant Empty Metadata Time-to-Live | KnownTenantEmptyMetadataTtl | "General" tab => "Advanced" collapsible |
|Known Tenant Prefixes | KnownTenantPrefix | "General" tab => "Advanced" collapsible |
|Only User Token Claims Enabled | OnlyUserTokenClaimsEnabled | "Identity Asserter Configuration" tab |
|Port | Port | "General" tab |
|Prefer Alternate ID | PreferAltId | "General" tab => "Advanced" collapsible |
|Resource Tenant Token Claim | ResourceTenantTokenClaim | "Authorization Bearer" tab |
|Response Read Timeout | ResponseReadTimeout | "Tuning Parameters" tab |
|Server Backoff Enabled | ServerBackoffEnabled | "General" tab => "Advanced" collapsible |
|Server Not Available Counter Interval | ServerNotAvailableCounterInterval | "General" tab => "Advanced" collapsible |
|Signature Prefer X509 Certificate | SignaturePreferX509Certificate | "Identity Asserter Configuration" tab |
|SSL Enabled | SslEnabled | "General" tab |
|Sync Filter Enabled | SyncFilterEnabled | "Sync Filter Configuration" tab |
|Sync Filter Match Case | SyncFilterMatchCase | "Sync Filter Configuration" tab |
|Sync Filter Only Client Cert Requests | SyncFilterOnlyClientCertRequests | "Sync Filter Configuration" tab |
|Sync Filter Prefer Header | SyncFilterPreferHeader | "Sync Filter Configuration" tab |
|Sync Filter User Header Names | SyncFilterUserHeaderName | "Sync Filter Configuration" tab |
|Tenant | Tenant | "General" tab |
|Tenant Data Flush Interval | TenantDataFlushInterval | "Tuning Parameters" tab |
|Tenant Data Reload Enabled | TenantDataReloadEnabled | "Identity Asserter Configuration" tab |
|Tenant Data Reload Interval | TenantDataReloadInterval | "Identity Asserter Configuration" tab |
|Tenant Header Names | TenantHeaderName | "General" tab |
|Tenant Host Name Template | TenantHostNameTemplate | "General" tab |
|Tenant Names | TenantName | "General" tab |
|Tenant Token Claim | TenantTokenClaim | "Identity Asserter Configuration" tab |
|Thread Lock Timeout | ThreadLockTimeout | "Tuning Parameters" tab |
|Token Cache Enabled | TokenCacheEnabled | "Caching" tab |
|Token Clock Skew | TokenClockSkew | "Identity Asserter Configuration" tab |
|Token Secure Transport Required | TokenSecureTransportRequired | "General" tab => "Advanced" collapsible |
|Token Validation Level | TokenValidationLevel | "Identity Asserter Configuration" tab |
|Token Virtual User Allowed | TokenVirtualUserAllowed | "Identity Asserter Configuration" tab |
|Unknown Tenant Empty Metadata Tine-to-Live | UnknownTenantEmptyMetadataTtl | "General" tab => "Advanced" collapsible |
|User Authentication Assertion Attribute | UserAuthenticationAssertionAttribute | "SCIM Authentication" tab |
|User ID Resource Attribute | UserIdResourceAttribute | "SCIM Authentication" tab |
|User ID Token Claim | UserIdTokenClaim | "Identity Asserter Configuration" tab |
|User Name Resource Attribute | UserNameResourceAttribute | "SCIM Authentication" tab |
|User Name Token Claim | UserNameTokenClaim | "Identity Asserter Configuration" tab |
|Use Retrieved User Name As Principal | UseRetrievedUserNameAsPrincipal | "SCIM Authentication" tab |

### SecurityConfiguration / Realm / Authorizer / DefaultAuthorizer
Navigate to: Topology => Security Configuration => Realms => (instance) => Authorizers => (instance of type DefaultAuthorizer)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Policy Deployment Enabled | PolicyDeploymentEnabled |  |

### SecurityConfiguration / Realm / Authorizer / XACMLAuthorizer
Navigate to: Topology => Security Configuration => Realms => (instance) => Authorizers => (instance of type XACMLAuthorizer)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Policy Deployment Enabled | PolicyDeploymentEnabled |  |

### SecurityConfiguration / Realm / CertPathProvider / CertificateRegistry
Navigate to: Topology => Security Configuration => Realms => (instance) => Certificate Path Providers => (instance of type CertificateRegistry)

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### SecurityConfiguration / Realm / CertPathProvider / WebLogicCertPathProvider
Navigate to: Topology => Security Configuration => Realms => (instance) => Certificate Path Providers => (instance of type WebLogicCertPathProvider)

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### SecurityConfiguration / Realm / CredentialMapper / DefaultCredentialMapper
Navigate to: Topology => Security Configuration => Realms => (instance) => Credential Mappers => (instance of type DefaultCredentialMapper)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Credential Mapping Deployment Enabled | CredentialMappingDeploymentEnabled |  |
|JWT Token Expiration | JwtTokenExpiration |  |
|Management Token Max Timeout | ManagementTokenMaxTimeout |  |

### SecurityConfiguration / Realm / CredentialMapper / PKICredentialMapper
Navigate to: Topology => Security Configuration => Realms => (instance) => Credential Mappers => (instance of type PKICredentialMapper)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Keystore File Name | KeyStoreFileName |  |
|Keystore Passphrase | KeyStorePassPhraseEncrypted |  |
|Keystore Provider | KeyStoreProvider |  |
|Keystore Type | KeyStoreType |  |
|Use Initiator Group Names | UseInitiatorGroupNames |  |
|Use Resource Hierarchy | UseResourceHierarchy |  |

### SecurityConfiguration / Realm / CredentialMapper / SAML2CredentialMapper
Navigate to: Topology => Security Configuration => Realms => (instance) => Credential Mappers => (instance of type SAML2CredentialMapper)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Credential Cache Minimum Viable Time-to-Live | CredCacheMinViableTtl |  |
|Credential Cache Size | CredCacheSize |  |
|Default Time-to-Live | DefaultTimeToLive |  |
|Default Time-to-Live Offset | DefaultTimeToLiveOffset |  |
|Generate Attributes | GenerateAttributes |  |
|Issuer URI | IssuerUri |  |
|Name Mapper Class Name | NameMapperClassName |  |
|Name Qualifier | NameQualifier |  |
|Signing Key Alias | SigningKeyAlias |  |
|Signing Key Passphrase | SigningKeyPassPhraseEncrypted |  |

### SecurityConfiguration / Realm / CredentialMapper / SAMLCredentialMapperV2
Navigate to: Topology => Security Configuration => Realms => (instance) => Credential Mappers => (instance of type SAMLCredentialMapperV2)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Credential Cache Minimum Viable Time-to-Live | CredCacheMinViableTtl |  |
|Credential Cache Size | CredCacheSize |  |
|Default Time-to-Live | DefaultTimeToLive |  |
|Default Time-to-Live Delta | DefaultTimeToLiveDelta |  |
|Issuer URI | IssuerUri |  |
|Minimum Parser Pool Size | MinimumParserPoolSize |  |
|Name Mapper Class Name | NameMapperClassName |  |
|Name Qualifier | NameQualifier |  |
|Signing Key Alias | SigningKeyAlias |  |
|Signing Key Passphrase | SigningKeyPassPhraseEncrypted |  |

### SecurityConfiguration / Realm / PasswordValidator / SystemPasswordValidator
Navigate to: Topology => Security Configuration => Realms => (instance) => Password Validators => (instance of type SystemPasswordValidator)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Max Consecutive Characters | MaxConsecutiveCharacters |  |
|Max Instances Of Any Character | MaxInstancesOfAnyCharacter |  |
|Max Password Length | MaxPasswordLength |  |
|Min Alphabetic Characters | MinAlphabeticCharacters |  |
|Min Lowercase Characters | MinLowercaseCharacters |  |
|Min Non Alphanumeric Characters | MinNonAlphanumericCharacters |  |
|Min Numeric Characters | MinNumericCharacters |  |
|Min Numeric Or Special Characters | MinNumericOrSpecialCharacters |  |
|Min Password Length | MinPasswordLength |  |
|Min Uppercase Characters | MinUppercaseCharacters |  |
|Reject Equal Or Contain Reverse Username | RejectEqualOrContainReverseUsername |  |
|Reject Equal Or Contain Username | RejectEqualOrContainUsername |  |

### SecurityConfiguration / Realm / RDBMSSecurityStore
Navigate to: Topology => Security Configuration => Realms => (instance) => RDBMS Security Store

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Properties | ConnectionProperties |  |
|Connection URL | ConnectionURL |  |
|Driver Name | DriverName |  |
|JMS Exception Reconnect Attempts | JMSExceptionReconnectAttempts | "JMS Notifications" section |
|JMS Topic | JMSTopic | "JMS Notifications" section |
|JMS Topic Connection Factory | JMSTopicConnectionFactory | "JMS Notifications" section |
|JNDI Password | JNDIPasswordEncrypted | "JMS Notifications" section |
|JNDI Username | JNDIUsername | "JMS Notifications" section |
|Notification Properties | NotificationProperties | "JMS Notifications" section |
|Password | PasswordEncrypted |  |
|Username | Username |  |

### SecurityConfiguration / Realm / RoleMapper / DefaultRoleMapper
Navigate to: Topology => Security Configuration => Realms => (instance) => Role Mappers => (instance of type DefaultRoleMapper)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Role Deployment Enabled | RoleDeploymentEnabled |  |

### SecurityConfiguration / Realm / RoleMapper / XACMLRoleMapper
Navigate to: Topology => Security Configuration => Realms => (instance) => Role Mappers => (instance of type XACMLRoleMapper)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deploy Base Predicates Enabled | DeployBasePredicatesEnabled |  |
|Role Deployment Enabled | RoleDeploymentEnabled |  |

### SecurityConfiguration / Realm / UserLockoutManager
Navigate to: Topology => Security Configuration => Realms => (instance) => User Lockout Manager

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Lockout Cache Size | LockoutCacheSize |  |
|Lockout Duration | LockoutDuration |  |
|Lockout Enabled | LockoutEnabled |  |
|Lockout GC Threshold | LockoutGcThreshold |  |
|Lockout Reset Duration | LockoutResetDuration |  |
|Lockout Threshold | LockoutThreshold |  |

### SecurityConfiguration / SecureMode
Navigate to: Topology => Security Configuration => Secure Mode

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Restrictive JMX Policies | RestrictiveJmxPolicies |  |
|Secure Mode Enabled | SecureModeEnabled |  |
|Warn On Anonymous Requests | WarnOnAnonymousRequests |  |
|Warn On Auditing | WarnOnAuditing |  |
|Warn On Insecure Applications | WarnOnInsecureApplications |  |
|Warn On Insecure Data Sources | WarnOnInsecureDataSources |  |
|Warn On Insecure File System | WarnOnInsecureFileSystem |  |
|Warn On Insecure SSL | WarnOnInsecureSsl |  |
|Warn On Java Security Manager | WarnOnJavaSecurityManager |  |
|Warn On Patches | WarnOnPatches |  |
|Warn On Ports | WarnOnPorts |  |
|Warn On Samples | WarnOnSamples |  |
|Warn On User Lockout | WarnOnUserLockout |  |
|Warn On Username Passwords | WarnOnUsernamePasswords |  |

### SelfTuning
Navigate to: Resources => Self Tuning

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### SelfTuning / Capacity
Navigate to: Resources => Self Tuning => Capacity Constraints => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Count | Count |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Targets | Target |  |

### SelfTuning / ContextRequestClass
Navigate to: Resources => Self Tuning => Context Request Classes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Targets | Target |  |

### SelfTuning / ContextRequestClass / ContextCase
Navigate to: Resources => Self Tuning => Context Request Classes => (instance) => Context Cases => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Group Name | GroupName |  |
|Notes | Notes |  |
|Request Class Name | RequestClassName |  |
|Targets | Target |  |
|User Name | UserName |  |

### SelfTuning / FairShareRequestClass
Navigate to: Resources => Self Tuning => Fair Share Request Classes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Fair Share | FairShare |  |
|Notes | Notes |  |
|Targets | Target |  |

### SelfTuning / MaxThreadsConstraint
Navigate to: Resources => Self Tuning => Max Threads Constraints => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Pool Name | ConnectionPoolName |  |
|Count | Count |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Queue Size | QueueSize |  |
|Targets | Target |  |

### SelfTuning / MinThreadsConstraint
Navigate to: Resources => Self Tuning => Min Threads Constraints => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Count | Count |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Targets | Target |  |

### SelfTuning / ResponseTimeRequestClass
Navigate to: Resources => Self Tuning => Response Time Request Classes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Goal Milliseconds | GoalMs |  |
|Notes | Notes |  |
|Targets | Target |  |

### SelfTuning / WorkManager
Navigate to: Resources => Self Tuning => Work Managers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Application Scope | ApplicationScope |  |
|Capacity Constraint | Capacity |  |
|Context Request Class | ContextRequestClass |  |
|Deployment Order | DeploymentOrder |  |
|Fair Share Request Class | FairShareRequestClass |  |
|Ignore Stuck Threads | IgnoreStuckThreads |  |
|Max Threads Constraint | MaxThreadsConstraint |  |
|Min Threads Constraint | MinThreadsConstraint |  |
|Notes | Notes |  |
|Response Time Request Class | ResponseTimeRequestClass |  |
|Targets | Target |  |

### SelfTuning / WorkManager / WorkManagerShutdownTrigger
Navigate to: Resources => Self Tuning => Work Managers => (instance) => Work Manager Shutdown Trigger

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Max Stuck Thread Time | MaxStuckThreadTime |  |
|Notes | Notes |  |
|Resume When Unstuck | ResumeWhenUnstuck |  |
|Stuck Thread Count | StuckThreadCount |  |

### Server
Navigate to: Topology => Servers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Backlog | AcceptBacklog | "Tuning" tab => "Advanced" collapsible |
|Add Work Manager Threads By CPU Count | AddWorkManagerThreadsByCpuCount | "Tuning" tab => "Advanced" collapsible |
|Admin Server Reconnect Interval Seconds | AdminReconnectIntervalSeconds | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Administration Port | AdministrationPort | "General" tab |
|Allow Shrinking Priority Request Queue | AllowShrinkingPriorityRequestQueue | "Tuning" tab => "Advanced" collapsible |
|Auto Migration Enabled | AutoMigrationEnabled | "Lifecycle" tab => "Migration" tab |
|Auto Restart | AutoRestart | "Lifecycle" tab => "Health" tab |
|Buzz Address | BuzzAddress | "Protocols" tab => "Advanced" collapsible |
|Buzz Enabled | BuzzEnabled | "Protocols" tab => "Advanced" collapsible |
|Buzz Port | BuzzPort | "Protocols" tab => "Advanced" collapsible |
|COM Enabled | COMEnabled | "Protocols" tab => "Advanced" collapsible |
|Candidate Machines | CandidateMachine | "Lifecycle" tab => "Migration" tab |
|Classpath Servlet Disabled | ClasspathServletDisabled | "Application" tab |
|Classpath Servlet Secure Mode Enabled | ClasspathServletSecureModeEnabled | "Application" tab |
|Cleanup Orphaned Sessions Enabled | CleanupOrphanedSessionsEnabled | "Cluster" tab |
|Client Certificate Proxy Enabled | ClientCertProxyEnabled | "General" tab |
|Cluster | Cluster | "General" tab |
|Cluster Weight | ClusterWeight | "Cluster" tab |
|Coherence Cluster System Resource | CoherenceClusterSystemResource | "Coherence" tab |
|Complete Message Timeout | CompleteMessageTimeout | "Protocols" tab |
|Complete Write Timeout | CompleteWriteTimeout | "Protocols" tab |
|Connect Timeout | ConnectTimeout | "Protocols" tab |
|Custom Identity Keystore File Name | CustomIdentityKeyStoreFileName | "Keystores" tab |
|Custom Identity Keystore Passphrase | CustomIdentityKeyStorePassPhraseEncrypted | "Keystores" tab |
|Custom Identity Keystore Type | CustomIdentityKeyStoreType | "Keystores" tab |
|Custom Trust Keystore File Name | CustomTrustKeyStoreFileName | "Keystores" tab |
|Custom Trust Keystore Passphrase | CustomTrustKeyStorePassPhraseEncrypted | "Keystores" tab |
|Custom Trust Keystore Type | CustomTrustKeyStoreType | "Keystores" tab |
|DGC Idle Periods Until Timeout | DGCIdlePeriodsUntilTimeout | "Tuning" tab => "Advanced" collapsible |
|Default IIOP Password | DefaultIIOPPasswordEncrypted | "Protocols" tab => "Advanced" collapsible |
|Default IIOP User | DefaultIIOPUser | "Protocols" tab => "Advanced" collapsible |
|Default Internal Servlets Disabled | DefaultInternalServletsDisabled | "Application" tab => "Advanced" collapsible |
|Default Protocol | DefaultProtocol | "Protocols" tab |
|Default Secure Protocol | DefaultSecureProtocol | "Protocols" tab |
|Default TGIOP Password | DefaultTGIOPPasswordEncrypted | "Protocols" tab => "Advanced" collapsible |
|Default TGIOP User | DefaultTGIOPUser | "Protocols" tab => "Advanced" collapsible |
|Eager Thread Local Cleanup | EagerThreadLocalCleanup | "Tuning" tab => "Advanced" collapsible |
|External DNS Name | ExternalDNSName | "General" tab => "Advanced" collapsible |
|Extra EJB Compiler Options | ExtraEjbcOptions | "Application" tab |
|Extra RMI Compiler Options | ExtraRmicOptions | "Application" tab |
|Gathered Writes Enabled | GatheredWritesEnabled | "Tuning" tab => "Advanced" collapsible |
|Graceful Shutdown Timeout | GracefulShutdownTimeout | "Lifecycle" tab => "General" tab |
|Health Check Interval Seconds | HealthCheckIntervalSeconds | "Lifecycle" tab => "Health" tab |
|Health Check Start Delay Seconds | HealthCheckStartDelaySeconds | "Lifecycle" tab => "Health" tab |
|HTTP Trace Support Enabled | HttpTraceSupportEnabled | "Protocols" tab => "Advanced" collapsible |
|HTTP Enabled | HttpdEnabled | "Protocols" tab => "Advanced" collapsible |
|IIOP Enabled | IIOPEnabled | "Protocols" tab => "Advanced" collapsible |
|Idle Connection Timeout | IdleConnectionTimeout | "Protocols" tab |
|Idle Periods Until Timeout | IdlePeriodsUntilTimeout | "Tuning" tab => "Advanced" collapsible |
|Ignore Sessions During Shutdown | IgnoreSessionsDuringShutdown | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Instrument Stack Trace Enabled | InstrumentStackTraceEnabled | "Diagnostics" tab |
|Interface Address | InterfaceAddress | "Cluster" tab |
|JDBC Last Logging Resource (LLR) Table Name | JDBCLLRTableName | "Transactions" tab |
|JMS Default Connection Factories Enabled | JMSDefaultConnectionFactoriesEnabled | "Application" tab |
|JNDI Transportable Object Factory List | JNDITransportableObjectFactoryList | "Application" tab => "Advanced" collapsible |
|Java Compiler | JavaCompiler | "Application" tab |
|Java Compiler Post Class Path | JavaCompilerPostClassPath | "Application" tab |
|Java Compiler Pre Class Path | JavaCompilerPreClassPath | "Application" tab |
|Java Standard Trust Keystore Passphrase | JavaStandardTrustKeyStorePassPhraseEncrypted | "Keystores" tab |
|JMS Connection Factory Unmapped Resource Reference Mode | JmsConnectionFactoryUnmappedResRefMode | "Application" tab => "Advanced" collapsible |
|Keystores | KeyStores | "Keystores" tab |
|Listen Address | ListenAddress | "General" tab |
|Listen Port | ListenPort | "General" tab |
|Listen Port Enabled | ListenPortEnabled | "General" tab |
|Listen Thread Start Delay Secs | ListenThreadStartDelaySecs | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Listeners Bind Early | ListenersBindEarly | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Log Critical Remote Exceptions Enabled | LogCriticalRemoteExceptionsEnabled | "Logging" tab |
|Log Remote Exceptions Enabled | LogRemoteExceptionsEnabled | "Logging" tab |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Tuning" tab => "Advanced" collapsible |
|MTU Size | MTUSize | "Tuning" tab => "Advanced" collapsible |
|Machine | Machine | "General" tab |
|Managed Server Independence Enabled | ManagedServerIndependenceEnabled | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Max Concurrent Long Running Requests | MaxConcurrentLongRunningRequests | "Tuning" tab => "Advanced" collapsible |
|Max Concurrent New Threads | MaxConcurrentNewThreads | "Tuning" tab => "Advanced" collapsible |
|Max Message Size | MaxMessageSize | "Protocols" tab |
|Max Open Sock Count | MaxOpenSockCount | "Tuning" tab => "Advanced" collapsible |
|Message ID Prefix Enabled | MessageIdPrefixEnabled | "Logging" tab |
|Muxer Class | MuxerClass | "Tuning" tab |
|Node Manager Socket Create Timeout In Milliseconds | NMSocketCreateTimeoutInMillis | "Tuning" tab |
|Native I/O Enabled | NativeIOEnabled | "Tuning" tab |
|Notes | Notes | "General" tab |
|Number Of Retries Before Managed Server Independence Mode | NumOfRetriesBeforeMsiMode | "Lifecycle" tab => "Health" tab |
|Outbound Enabled | OutboundEnabled | "General" tab => "Advanced" collapsible |
|Outbound Private Key Enabled | OutboundPrivateKeyEnabled | "General" tab => "Advanced" collapsible |
|Period Length | PeriodLength | "Tuning" tab => "Advanced" collapsible |
|Preferred Secondary Group | PreferredSecondaryGroup | "Cluster" tab |
|Print Stack Trace In Production | PrintStackTraceInProduction | "Logging" tab |
|Reliable Delivery Policy | ReliableDeliveryPolicy | "Application" tab |
|Replication Group | ReplicationGroup | "Cluster" tab |
|Replication Ports | ReplicationPorts | "Cluster" tab |
|Resolve DNS Name | ResolveDNSName | "Tuning" tab |
|Restart Delay Seconds | RestartDelaySeconds | "Lifecycle" tab => "Health" tab |
|Restart Interval Seconds | RestartIntervalSeconds | "Lifecycle" tab => "Health" tab |
|Restart Max | RestartMax | "Lifecycle" tab => "Health" tab |
|Retry Interval Before Managed Server Independence Mode | RetryIntervalBeforeMsiMode | "Lifecycle" tab => "Health" tab |
|Reverse DNS Allowed | ReverseDNSAllowed | "Tuning" tab |
|RMI Deserialization Max Time Limit | RmiDeserializationMaxTimeLimit | "Application" tab => "Advanced" collapsible |
|Scattered Reads Enabled | ScatteredReadsEnabled | "Tuning" tab => "Advanced" collapsible |
|Self Tuning Thread Pool Size Max | SelfTuningThreadPoolSizeMax | "Tuning" tab |
|Self Tuning Thread Pool Size Min | SelfTuningThreadPoolSizeMin | "Tuning" tab |
|Server Life Cycle Timeout Value | ServerLifeCycleTimeoutVal | "Lifecycle" tab => "General" tab |
|Server Template | ServerTemplate | "General" tab => "Advanced" collapsible |
|Session Replication On Shutdown Enabled | SessionReplicationOnShutdownEnabled | "Cluster" tab |
|Situational Config Polling Interval | SitConfigPollingInterval | "General" tab => "Advanced" collapsible |
|Situational Config Required | SitConfigRequired | "General" tab => "Advanced" collapsible |
|Socket Buffer Size As Chunk Size | SocketBufferSizeAsChunkSize | "Tuning" tab => "Advanced" collapsible |
|Socket Readers | SocketReaders | "Tuning" tab |
|Staging Directory Name | StagingDirectoryName | "Application" tab |
|Staging Mode | StagingMode | "Application" tab |
|Startup Mode | StartupMode | "Lifecycle" tab => "General" tab |
|Startup Timeout | StartupTimeout | "Lifecycle" tab => "General" tab |
|Stuck Thread Timer Interval | StuckThreadTimerInterval | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Synchronized Session Timeout Enabled | SynchronizedSessionTimeoutEnabled | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|System Password | SystemPasswordEncrypted | "General" tab => "Advanced" collapsible |
|TGIOP Enabled | TGIOPEnabled | "Protocols" tab => "Advanced" collapsible |
|Thread Pool Percent Socket Readers | ThreadPoolPercentSocketReaders | "Tuning" tab |
|Transaction Log File Prefix | TransactionLogFilePrefix | "Transactions" tab |
|Transaction Log File Write Policy | TransactionLogFileWritePolicy | "Transactions" tab |
|Transaction Primary Channel Name | TransactionPrimaryChannelName | "Transactions" tab |
|Transaction Public Channel Name | TransactionPublicChannelName | "Transactions" tab |
|Transaction Public Secure Channel Name | TransactionPublicSecureChannelName | "Transactions" tab |
|Transaction Secure Channel Name | TransactionSecureChannelName | "Transactions" tab |
|Tunneling Client Ping Seconds | TunnelingClientPingSecs | "Protocols" tab |
|Tunneling Client Timeout Seconds | TunnelingClientTimeoutSecs | "Protocols" tab |
|Tunneling Enabled | TunnelingEnabled | "Protocols" tab |
|Upload Directory Name | UploadDirectoryName | "Application" tab |
|Use 8.1-Style Execute Queues | Use81StyleExecuteQueues | "Tuning" tab |
|Use Concurrent Queue For Request Manager | UseConcurrentQueueForRequestManager | "Tuning" tab |
|Use Detailed Thread Name | UseDetailedThreadName | "Diagnostics" tab |
|Use Enhanced Increment Advisor | UseEnhancedIncrementAdvisor | "Tuning" tab |
|Use Enhanced Priority Queue For Request Manager | UseEnhancedPriorityQueueForRequestManager | "Tuning" tab |
|Use Fusion For Last Logging Resource | UseFusionForLLR | "Transactions" tab |
|WebLogic Plug-in Enabled | WeblogicPluginEnabled | "General" tab |
|XML Entity Cache | XMLEntityCache | "Application" tab |
|XML Registry | XMLRegistry | "Application" tab |

### Server / COM
Navigate to: Topology => Servers => (instance) => COM

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Apartment Threaded | ApartmentThreaded |  |
|Memory Logging Enabled | MemoryLoggingEnabled |  |
|NT Authentication Host | NTAuthHost |  |
|Native Mode Enabled | NativeModeEnabled |  |
|Notes | Notes |  |
|Prefetch Enums | PrefetchEnums |  |
|Verbose Logging Enabled | VerboseLoggingEnabled |  |

### Server / CoherenceMemberConfig
Navigate to: Topology => Servers => (instance) => Coherence Member Config

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Coherence Web Federated Storage Enabled | CoherenceWebFederatedStorageEnabled | "Advanced" collapsible |
|Coherence Web Local Storage Enabled | CoherenceWebLocalStorageEnabled | "Advanced" collapsible |
|Local Storage Enabled | LocalStorageEnabled | "Advanced" collapsible |
|Notes | Notes |  |
|Rack Name | RackName |  |
|Role Name | RoleName |  |
|Site Name | SiteName |  |
|Unicast Listen Address | UnicastListenAddress |  |
|Unicast Listen Port | UnicastListenPort |  |
|Unicast Port Auto Adjust Attempts | UnicastPortAutoAdjustAttempts | "Advanced" collapsible |

### Server / ConfigurationProperty
Navigate to: Topology => Servers => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### Server / DataSource
Navigate to: Topology => Servers => (instance) => Data Source

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Datasource | DefaultDatasource |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|RMI JDBC Security | RmiJDBCSecurity |  |
|Targets | Target |  |

### Server / DataSource / DataSourceLogFile
Navigate to: Topology => Servers => (instance) => Data Source => Data Source Log File

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor | "Advanced" collapsible |
|Log File Rotation Directory | LogFileRotationDir |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### Server / DefaultFileStore
Navigate to: Topology => Servers => (instance) => Default File Store

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Block Size | BlockSize | "Advanced" collapsible |
|Cache Directory | CacheDirectory |  |
|Directory | Directory |  |
|File Locking Enabled | FileLockingEnabled | "Advanced" collapsible |
|Initial Size | InitialSize | "Advanced" collapsible |
|I/O Buffer Size | IoBufferSize | "Advanced" collapsible |
|Max File Size | MaxFileSize | "Advanced" collapsible |
|Max Window Buffer Size | MaxWindowBufferSize | "Advanced" collapsible |
|Min Window Buffer Size | MinWindowBufferSize | "Advanced" collapsible |
|Notes | Notes |  |
|Synchronous Write Policy | SynchronousWritePolicy |  |

### Server / ExecuteQueue
Navigate to: Topology => Servers => (instance) => Execute Queues => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Queue Length | QueueLength |  |
|Queue Length Threshold Percent | QueueLengthThresholdPercent |  |
|Thread Count | ThreadCount |  |
|Threads Increase | ThreadsIncrease |  |
|Threads Maximum | ThreadsMaximum |  |
|Threads Minimum | ThreadsMinimum |  |
|Thread Priority | ThreadPriority | "Advanced" collapsible |

### Server / HealthScore
Navigate to: Topology => Servers => (instance) => Health Score

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Calculate Interval Seconds | CalculateIntervalSecs |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Plug-in Class Name | PluginClassName |  |

### Server / IIOP
Navigate to: Topology => Servers => (instance) => IIOP

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Character Codeset | DefaultCharCodeset |  |
|Default Minor Version | DefaultMinorVersion |  |
|Default Wide Character Codeset | DefaultWideCharCodeset |  |
|Enable IOR Servlet | EnableIORServlet | "Advanced" collapsible |
|Notes | Notes |  |
|System Security | SystemSecurity |  |
|Tx Mechanism | TxMechanism |  |
|Use Full Repository ID List | UseFullRepositoryIdList |  |
|Use Java Serialization | UseJavaSerialization | "Advanced" collapsible |
|Use Locate Request | UseLocateRequest | "Advanced" collapsible |
|Use Serial Format Version 2 | UseSerialFormatVersion2 |  |
|Use Stateful Authentication | UseStatefulAuthentication |  |

### Server / JTAMigratableTarget
Navigate to: Topology => Servers => (instance) => JTA Migratable Target

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Additional Migration Attempts | AdditionalMigrationAttempts |  |
|Cluster | Cluster |  |
|Constrained Candidate Servers | ConstrainedCandidateServer |  |
|Critical | Critical |  |
|Migration Policy | MigrationPolicy |  |
|Milliseconds To Sleep Between Attempts | MillisToSleepBetweenAttempts |  |
|Non-Local Post-Deactivation Script Allowed | NonLocalPostAllowed |  |
|Notes | Notes |  |
|Number Of Restart Attempts | NumberOfRestartAttempts |  |
|Post-Deactivation Script | PostScript |  |
|Post-Deactivation Script Failure is Fatal | PostScriptFailureFatal |  |
|Pre-Migration Script | PreScript |  |
|Restart On Failure | RestartOnFailure |  |
|Seconds Between Restarts | SecondsBetweenRestarts |  |
|Strict Ownership Check | StrictOwnershipCheck |  |
|User Preferred Server | UserPreferredServer |  |

### Server / Log
Navigate to: Topology => Servers => (instance) => Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|Domain Log Broadcast Filter | DomainLogBroadcastFilter | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcast Severity | DomainLogBroadcastSeverity | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcaster Buffer Size | DomainLogBroadcasterBufferSize | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Filter | LogFileFilter | "Advanced" collapsible |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log File Severity | LogFileSeverity | "Advanced" collapsible |
|Log Monitoring Enabled | LogMonitoringEnabled | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Interval Seconds | LogMonitoringIntervalSecs | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Max Throttle Message Signature Count | LogMonitoringMaxThrottleMessageSignatureCount | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Message Length | LogMonitoringThrottleMessageLength | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Threshold | LogMonitoringThrottleThreshold | "Advanced" collapsible => "Log Monitoring Settings" section |
|Logger Severity | LoggerSeverity | "Advanced" collapsible |
|Logger Severity Properties | LoggerSeverityProperties | "Advanced" collapsible |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Platform Logger Levels | PlatformLoggerLevels | "Advanced" collapsible |
|Redirect Stderr To Server Log Enabled | RedirectStderrToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Redirect Stdout To Server Log Enabled | RedirectStdoutToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |
|Stacktrace Depth | StacktraceDepth | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Filter | StdoutFilter | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Format | StdoutFormat | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Log Stack | StdoutLogStack | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Severity | StdoutSeverity | "Advanced" collapsible => "Standard Out Log Settings" section |
|Trigger Truncation Stack Frame Depth After Trigger | TriggerTruncationStackFrameDepthAfterTrigger | "Advanced" collapsible => "Miscellaneous" section |
|Trigger Truncation Stack Frame Trigger Depth | TriggerTruncationStackFrameTriggerDepth | "Advanced" collapsible => "Miscellaneous" section |

### Server / NetworkAccessPoint
Navigate to: Topology => Servers => (instance) => Network Access Points => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Backlog | AcceptBacklog | "Tuning Parameters" tab |
|Allow List Violation Action | AllowListViolationAction | "Security" tab => "Advanced" collapsible |
|Allow Unencrypted Null Cipher | AllowUnencryptedNullCipher | "Security" tab => "Advanced" collapsible |
|Channel Identity Customized | ChannelIdentityCustomized | "Security" tab => "Advanced" collapsible |
|Channel Weight | ChannelWeight | "Tuning Parameters" tab |
|Cipher Suites | Ciphersuite | "Security" tab => "Advanced" collapsible |
|Client Certificate Enforced | ClientCertificateEnforced | "Security" tab |
|Client-Initiated Secure Renegotiation Accepted | ClientInitSecureRenegotiationAccepted | "Security" tab => "Advanced" collapsible |
|Cluster Address | ClusterAddress | "General" tab => "Advanced" collapsible |
|Complete Message Timeout | CompleteMessageTimeout | "Protocols" tab |
|Connect Timeout | ConnectTimeout | "Protocols" tab |
|Custom Identity Keystore File Name | CustomIdentityKeyStoreFileName | "Security" tab => "Keystore Configuration" section |
|Custom Identity Keystore Passphrase | CustomIdentityKeyStorePassPhraseEncrypted | "Security" tab => "Keystore Configuration" section |
|Custom Identity Keystore Type | CustomIdentityKeyStoreType | "Security" tab => "Keystore Configuration" section |
|Custom Private Key Alias | CustomPrivateKeyAlias | "Security" tab => "Keystore Configuration" section |
|Custom Private Key Passphrase | CustomPrivateKeyPassPhraseEncrypted | "Security" tab => "Keystore Configuration" section |
|Domain Keystores Client Certificate Alias | DomainKeystoresClientCertAlias | "Security" tab => "Keystore Configuration" section |
|Domain Keystores Server Certificate Alias | DomainKeystoresServerCertAlias | "Security" tab => "Keystore Configuration" section |
|Enabled | Enabled | "General" tab |
|External DNS Name | ExternalDNSName | "General" tab => "Advanced" collapsible |
|Excluded Cipher Suites | ExcludedCiphersuite | "Security" tab => "Advanced" collapsible |
|Hostname Verification Ignored | HostnameVerificationIgnored | "Security" tab |
|Hostname Verifier | HostnameVerifier | "Security" tab |
|HTTP Enabled For This Protocol | HttpEnabledForThisProtocol | "Protocols" tab |
|Idle Connection Timeout | IdleConnectionTimeout | "Protocols" tab |
|Inbound Certificate Validation | InboundCertificateValidation | "Security" tab |
|Listen Address | ListenAddress | "General" tab |
|Listen Port | ListenPort | "General" tab |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Tuning Parameters" tab |
|Login Timeout Millis SSL | LoginTimeoutMillisSSL | "Tuning Parameters" tab |
|Max Backoff Between Failures | MaxBackoffBetweenFailures | "Tuning Parameters" tab |
|Max Connected Clients | MaxConnectedClients | "Tuning Parameters" tab |
|Max Message Size | MaxMessageSize | "Protocols" tab |
|Minimum TLS Protocol Version | MinimumTlsProtocolVersion | "Security" tab |
|Notes | Notes | "General" tab |
|Outbound Certificate Validation | OutboundCertificateValidation | "Security" tab |
|Outbound Enabled | OutboundEnabled | "General" tab => "Advanced" collapsible |
|Outbound Private Key Enabled | OutboundPrivateKeyEnabled | "Security" tab => "Keystore Configuration" section |
|Protocol | Protocol | "General" tab |
|Proxy Address | ProxyAddress | "General" tab => "Advanced" collapsible |
|Proxy Port | ProxyPort | "General" tab => "Advanced" collapsible |
|Public Address | PublicAddress | "General" tab |
|Public Port | PublicPort | "General" tab |
|Resolve DNS Name | ResolveDNSName | "Tuning Parameters" tab |
|Socket Direct Protocol (SDP) Enabled | SdpEnabled | "Protocols" tab |
|Server Cipher Suites Order Enabled | ServerCipherSuitesOrderEnabled | "Security" tab => "Advanced" collapsible |
|SSL v2 Hello Enabled | SsLv2HelloEnabled | "Security" tab => "Advanced" collapsible |
|Timeout Connection With Pending Responses | TimeoutConnectionWithPendingResponses | "Tuning Parameters" tab |
|Tunneling Client Ping Seconds | TunnelingClientPingSecs | "Protocols" tab |
|Tunneling Client Timeout Seconds | TunnelingClientTimeoutSecs | "Protocols" tab |
|Tunneling Enabled | TunnelingEnabled | "Protocols" tab |
|Two-Way SSL Enabled | TwoWaySSLEnabled | "Security" tab |
|Use Fast Serialization | UseFastSerialization | "Tuning Parameters" tab |

### Server / OverloadProtection
Navigate to: Topology => Servers => (instance) => Overload Protection

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Failure Action | FailureAction |  |
|Free Memory Percent High Threshold | FreeMemoryPercentHighThreshold |  |
|Free Memory Percent Low Threshold | FreeMemoryPercentLowThreshold |  |
|Notes | Notes |  |
|Panic Action | PanicAction |  |
|Shared Capacity For Work Managers | SharedCapacityForWorkManagers |  |

### Server / OverloadProtection / ServerFailureTrigger
Navigate to: Topology => Servers => (instance) => Overload Protection => Server Failure Trigger

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Heap Dump On Deadlock | HeapDumpingOnDeadlock |  |
|Heap Dump On Max Stuck Threads | HeapDumpingOnMaxStuckThread |  |
|Max Stuck Thread Time | MaxStuckThreadTime |  |
|Stuck Thread Count | StuckThreadCount |  |
|Notes | Notes |  |
|Verbose Stuck Thread Name | VerboseStuckThreadName |  |

### Server / RmiForwarding
Navigate to: Topology => Servers => (instance) => RMI Forwarding => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|URL | Url |  |

### Server / RmiForwarding / ConfigurationProperty
Navigate to: Topology => Servers => (instance) => RMI Forwarding => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### Server / SSL
Navigate to: Topology => Servers => (instance) => SSL

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept KSS Demo Certs Enabled | AcceptKssDemoCertsEnabled |  |
|Allow Unencrypted Null Cipher | AllowUnencryptedNullCipher | "Advanced" collapsible |
|Cipher Suites | Ciphersuite | "Advanced" collapsible |
|Client Certificate Alias | ClientCertAlias | "Advanced" collapsible |
|Client Certificate Private Key Passphrase | ClientCertPrivateKeyPassPhraseEncrypted | "Advanced" collapsible |
|Client Certificate Enforced | ClientCertificateEnforced | "Advanced" collapsible |
|Client-Initiated Secure Renegotiation Accepted | ClientInitSecureRenegotiationAccepted | "Advanced" collapsible |
|Domain Keystores Client Certificate Alias | DomainKeystoresClientCertAlias |  |
|Domain Keystores Server Certificate Alias | DomainKeystoresServerCertAlias |  |
|SSL Enabled | Enabled |  |
|Excluded Cipher Suites | ExcludedCiphersuite | "Advanced" collapsible |
|Export Key Lifespan | ExportKeyLifespan | "Advanced" collapsible |
|Hostname Verification Ignored | HostnameVerificationIgnored | "Advanced" collapsible |
|Hostname Verifier | HostnameVerifier | "Advanced" collapsible |
|Identity And Trust Locations | IdentityAndTrustLocations |  |
|Inbound Certificate Validation | InboundCertificateValidation | "Advanced" collapsible |
|JSSE Enabled | JSSEEnabled |  |
|SSL Listen Port | ListenPort |  |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Advanced" collapsible |
|Minimum TLS Protocol Version | MinimumTlsProtocolVersion |  |
|Notes | Notes |  |
|Outbound Certificate Validation | OutboundCertificateValidation | "Advanced" collapsible |
|Outbound Private Key Passphrase | OutboundPrivateKeyPassPhraseEncrypted | "Advanced" collapsible |
|SSL Rejection Logging Enabled | SSLRejectionLoggingEnabled | "Advanced" collapsible |
|Server Cipher Suites Order Enabled | ServerCipherSuitesOrderEnabled | "Advanced" collapsible |
|Server Private Key Alias | ServerPrivateKeyAlias |  |
|Server Private Key Passphrase | ServerPrivateKeyPassPhraseEncrypted |  |
|SSL v2 Hello Enabled | SsLv2HelloEnabled | "Advanced" collapsible |
|Two-Way SSL Enabled | TwoWaySSLEnabled | "Advanced" collapsible |
|Use Client Cert For Outbound | UseClientCertForOutbound | "Advanced" collapsible |
|Use Server Certificates | UseServerCerts | "Advanced" collapsible |

### Server / ServerDebug
Navigate to: Topology => Servers => (instance) => Server Debug

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Application Container | ApplicationContainer | "Application" tab |
|Class Change Notifier | ClassChangeNotifier | "Application" tab |
|Class Finder | ClassFinder | "Application" tab |
|Class Loader | ClassLoader | "Application" tab |
|Class Loader Verbose | ClassLoaderVerbose | "Application" tab |
|Classloader Web App | ClassloaderWebApp | "Application" tab |
|Classpath Servlet | ClasspathServlet | "Containers" tab |
|Debug Abbreviation | DebugAbbreviation | "Core" tab |
|Debug Abbrevs | DebugAbbrevs | "Core" tab |
|Debug Allow List | DebugAllowList | "Security" tab |
|Debug Application Annotations | DebugAppAnnotations | "Application" tab |
|Debug Application Annotation Lookup | DebugAppAnnoLookup | "Application" tab |
|Debug Application Annotation Query | DebugAppAnnoQuery | "Application" tab |
|Debug Application Annotation Query Verbose | DebugAppAnnoQueryVerbose | "Application" tab |
|Debug Application Annotation Scan Data | DebugAppAnnoScanData | "Application" tab |
|Debug Application Annotation Scan Verbose | DebugAppAnnoScanVerbose | "Application" tab |
|Debug Application Annotation Verbose Lookup | DebugAppAnnoVerboseLookup | "Application" tab |
|Debug Application Client | DebugAppClient | "Application" tab |
|Debug Application Container | DebugAppContainer | "Application" tab |
|Debug Application Container Tools | DebugAppContainerTools | "Application" tab |
|Debug Application Metadata Cache | DebugAppMetadataCache | "Application" tab |
|Debug Application Timing | DebugAppTiming | "Application" tab |
|Debug Async Queue | DebugAsyncQueue | "Core" tab |
|Debug Attach | DebugAttach | "Core" tab |
|Debug Background Deployment | DebugBackgroundDeployment | "Application" tab |
|Debug Batch Connector | DebugBatchConnector | "Containers" tab |
|Debug Bean Tree Harvester Control | DebugBeanTreeHarvesterControl | "Diagnostics" tab |
|Debug Bean Tree Harvester Data Collection | DebugBeanTreeHarvesterDataCollection | "Diagnostics" tab |
|Debug Bean Tree Harvester Resolution | DebugBeanTreeHarvesterResolution | "Diagnostics" tab |
|Debug Bean Tree Harvester Threading | DebugBeanTreeHarvesterThreading | "Diagnostics" tab |
|Debug Bootstrap Servlet | DebugBootstrapServlet | "Containers" tab |
|Debug Buzz Protocol | DebugBuzzProtocol | "Miscellaneous" tab |
|Debug Buzz Protocol Details | DebugBuzzProtocolDetails | "Miscellaneous" tab |
|Debug Buzz Protocol HTTP | DebugBuzzProtocolHttp | "Miscellaneous" tab |
|Debug Cat | DebugCat | "Miscellaneous" tab |
|Debug Certificate Check | DebugCertificateCheck | "Security" tab |
|Debug Cert Revoc Check | DebugCertRevocCheck | "Security" tab |
|Debug Channel | DebugChannel | "Network" tab |
|Debug Channel Map | DebugChannelMap | "Network" tab |
|Debug Class Loading Archive Checker | DebugClassLoadingArchiveChecker | "Application" tab |
|Debug Class Loading Consistency Checker | DebugClassLoadingConsistencyChecker | "Application" tab |
|Debug Class Loading Contextual Trace | DebugClassLoadingContextualTrace | "Application" tab |
|Debug Class Loading Verbose | DebugClassLoadingVerbose | "Application" tab |
|Debug Class Redefinition | DebugClassRedef | "Application" tab |
|Debug Class Size | DebugClassSize | "Application" tab |
|Debug Cluster | DebugCluster | "Core" tab |
|Debug Cluster Announcements | DebugClusterAnnouncements | "Core" tab |
|Debug Cluster Fragments | DebugClusterFragments | "Core" tab |
|Debug Cluster Heartbeats | DebugClusterHeartbeats | "Core" tab |
|Debug Cluster Verbose | DebugClusterVerbose | "Core" tab |
|Debug Coherence | DebugCoherence | "Core" tab |
|Debug Concurrent | DebugConcurrent | "Core" tab |
|Debug Concurrent Context | DebugConcurrentContext | "Core" tab |
|Debug Concurrent Managed Executor Services | DebugConcurrentMes | "Core" tab |
|Debug Concurrent Managed Scheduled Executor Services | DebugConcurrentMses | "Core" tab |
|Debug Concurrent Managed Thread Factories | DebugConcurrentMtf | "Core" tab |
|Debug Concurrent Transaction | DebugConcurrentTransaction | "Core" tab |
|Debug Configuration Edit | DebugConfigurationEdit | "Management" tab |
|Debug Configuration Runtime | DebugConfigurationRuntime | "Management" tab |
|Debug Connection | DebugConnection | "Core" tab |
|Debug Connector Service | DebugConnectorService | "Containers" tab |
|Debug Consensus Leasing | DebugConsensusLeasing | "Core" tab |
|Debug Coherence Web Global Reaper | DebugCWebGlobalReaper | "Core" tab |
|Debug Deserialization Time Limit | DebugDeserializationTimeLimit | "Security" tab |
|Debug Distributed GC Enrollment | DebugDGCEnrollment | "Core" tab |
|Debug Dynamic Load Balancing (DLB) | DebugDlb | "Messaging" tab |
|Debug Dynamic Load Balancing (DLB) Fine | DebugDlbFine | "Messaging" tab |
|Debug Dynamic Load Balancing (DLB) Finest | DebugDlbFinest | "Messaging" tab |
|Debug Data Replication Service Calls | DebugDRSCalls | "Core" tab |
|Debug Data Replication Service Heartbeats | DebugDRSHeartbeats | "Core" tab |
|Debug Data Replication Service Messages | DebugDRSMessages | "Core" tab |
|Debug Data Replication Service Queues | DebugDRSQueues | "Core" tab |
|Debug Data Replication Service State Transitions | DebugDRSStateTransitions | "Core" tab |
|Debug Data Replication Service Update Status | DebugDRSUpdateStatus | "Core" tab |
|Debug Data Source Interceptor | DebugDataSourceInterceptor | "Persistence" tab |
|Debug Debug Patches | DebugDebugPatches | "Diagnostics" tab |
|Debug Default Store Verbose | DebugDefaultStoreVerbose | "Application" tab |
|Debug Deploy | DebugDeploy | "Application" tab |
|Debug Deployment | DebugDeployment | "Application" tab |
|Debug Deployment Concise | DebugDeploymentConcise | "Application" tab |
|Debug Deployment Plan | DebugDeploymentPlan | "Application" tab |
|Debug Deployment Service | DebugDeploymentService | "Application" tab |
|Debug Deployment Service Internal | DebugDeploymentServiceInternal | "Application" tab |
|Debug Deployment Service Status Updates | DebugDeploymentServiceStatusUpdates | "Application" tab |
|Debug Deployment Service Transport | DebugDeploymentServiceTransport | "Application" tab |
|Debug Deployment Service Transport HTTP | DebugDeploymentServiceTransportHttp | "Application" tab |
|Debug Descriptor | DebugDescriptor | "Application" tab |
|Debug Diagnostic Accessor | DebugDiagnosticAccessor | "Diagnostics" tab |
|Debug Diagnostic Action Wrapper | DebugDiagnosticActionWrapper | "Diagnostics" tab |
|Debug Diagnostic Archive | DebugDiagnosticArchive | "Diagnostics" tab |
|Debug Diagnostic Archive Retirement | DebugDiagnosticArchiveRetirement | "Diagnostics" tab |
|Debug Diagnostic Collections | DebugDiagnosticCollections | "Diagnostics" tab |
|Debug Diagnostic Context | DebugDiagnosticContext | "Diagnostics" tab |
|Debug Diagnostic Data Gathering | DebugDiagnosticDataGathering | "Diagnostics" tab |
|Debug Diagnostic File Archive | DebugDiagnosticFileArchive | "Diagnostics" tab |
|Debug Diagnostic Image | DebugDiagnosticImage | "Diagnostics" tab |
|Debug Diagnostic Instrumentation | DebugDiagnosticInstrumentation | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Actions | DebugDiagnosticInstrumentationActions | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Class Info | DebugDiagnosticInstrumentationClassInfo | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Config | DebugDiagnosticInstrumentationConfig | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Events | DebugDiagnosticInstrumentationEvents | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Result | DebugDiagnosticInstrumentationResult | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Weaving | DebugDiagnosticInstrumentationWeaving | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Weaving Matches | DebugDiagnosticInstrumentationWeavingMatches | "Diagnostics" tab |
|Debug Diagnostic JDBC Archive | DebugDiagnosticJdbcArchive | "Diagnostics" tab |
|Debug Diagnostic Lifecycle Handlers | DebugDiagnosticLifecycleHandlers | "Diagnostics" tab |
|Debug Diagnostic Notifications | DebugDiagnosticNotifications | "Diagnostics" tab |
|Debug Diagnostic Query | DebugDiagnosticQuery | "Diagnostics" tab |
|Debug Diagnostic Runtime Control Driver | DebugDiagnosticRuntimeControlDriver | "Diagnostics" tab |
|Debug Diagnostic Runtime Control Service | DebugDiagnosticRuntimeControlService | "Diagnostics" tab |
|Debug Diagnostic Watch | DebugDiagnosticWatch | "Diagnostics" tab |
|Debug Diagnostic Watch Events | DebugDiagnosticWatchEvents | "Diagnostics" tab |
|Debug Diagnostic Watch Events Details | DebugDiagnosticWatchEventsDetails | "Diagnostics" tab |
|Debug Diagnostic Watch Utils | DebugDiagnosticWatchUtils | "Diagnostics" tab |
|Debug Diagnostic WebLogic Store Archive | DebugDiagnosticWlstoreArchive | "Diagnostics" tab |
|Debug Diagnostics Bean Extension Resolver | DebugDiagnosticsBeanExtensionResolver | "Diagnostics" tab |
|Debug Diagnostics Bean Info Providers | DebugDiagnosticsBeanInfoProviders | "Diagnostics" tab |
|Debug Diagnostics Expression Language Context | DebugDiagnosticsElContext | "Diagnostics" tab |
|Debug Diagnostics Expression Language Resolver | DebugDiagnosticsElResolver | "Diagnostics" tab |
|Debug Diagnostics Expression Evaluators | DebugDiagnosticsExpressionEvaluators | "Diagnostics" tab |
|Debug Diagnostics Expression Function Mapper | DebugDiagnosticsExpressionFunctionMapper | "Diagnostics" tab |
|Debug Diagnostics Expression Functions | DebugDiagnosticsExpressionFunctions | "Diagnostics" tab |
|Debug Diagnostics Expression Metrics | DebugDiagnosticsExpressionMetrics | "Diagnostics" tab |
|Debug Diagnostics Expression Poller | DebugDiagnosticsExpressionPoller | "Diagnostics" tab |
|Debug Diagnostics Expression Poller Buffer | DebugDiagnosticsExpressionPollerBuffer | "Diagnostics" tab |
|Debug Diagnostics Harvester | DebugDiagnosticsHarvester | "Diagnostics" tab |
|Debug Diagnostics Harvester Data | DebugDiagnosticsHarvesterData | "Diagnostics" tab |
|Debug Diagnostics Harvester MBean Plug-in | DebugDiagnosticsHarvesterMBeanPlugin | "Diagnostics" tab |
|Debug Diagnostics Harvester Tree Bean Plug-in | DebugDiagnosticsHarvesterTreeBeanPlugin | "Diagnostics" tab |
|Debug Diagnostics MBean Expression Language Resolver | DebugDiagnosticsMBeanElResolver | "Diagnostics" tab |
|Debug Diagnostics Module | DebugDiagnosticsModule | "Diagnostics" tab |
|Debug Diagnostics Notifications | DebugDiagnosticsNotifications | "Diagnostics" tab |
|Debug Diagnostics Script Action | DebugDiagnosticsScriptAction | "Diagnostics" tab |
|Debug Diagnostics Timer | DebugDiagnosticsTimer | "Diagnostics" tab |
|Debug Diagnostics Timer Service | DebugDiagnosticsTimerService | "Diagnostics" tab |
|Debug Diagnostics Utilities | DebugDiagnosticsUtils | "Diagnostics" tab |
|Debug Diagnostics Value Tracing Expression Language Resolver | DebugDiagnosticsValueTracingElResolver | "Diagnostics" tab |
|Debug Domain Log Handler | DebugDomainLogHandler | "Diagnostics" tab |
|Debug Domain Upgrade Server Service | DebugDomainUpgradeServerService | "Core" tab |
|Debug Dynamic Singleton Services | DebugDynamicSingletonServices | "Core" tab |
|Debug EJB Caching | DebugEjbCaching | "Containers" tab |
|Debug EJB Container-Managed Persistence Deployment | DebugEjbCmpDeployment | "Containers" tab |
|Debug EJB Container-Managed Persistence Runtime | DebugEjbCmpRuntime | "Containers" tab |
|Debug EJB Compilation | DebugEjbCompilation | "Containers" tab |
|Debug EJB Deployment | DebugEjbDeployment | "Containers" tab |
|Debug EJB Invoke | DebugEjbInvoke | "Containers" tab |
|Debug EJB Locking | DebugEjbLocking | "Containers" tab |
|Debug EJB MDB AQ Message Recovery | DebugEjbMdbAqMessageRecovery | "Containers" tab |
|Debug EJB MDB Connection | DebugEjbMdbConnection | "Containers" tab |
|Debug EJB MDB Listener | DebugEjbMdbListener | "Containers" tab |
|Debug EJB Metadata | DebugEjbMetadata | "Containers" tab |
|Debug EJB Pooling | DebugEjbPooling | "Containers" tab |
|Debug EJB Security | DebugEjbSecurity | "Containers" tab |
|Debug EJB Swapping | DebugEjbSwapping | "Containers" tab |
|Debug EJB Swapping Verbose | DebugEjbSwappingVerbose | "Containers" tab |
|Debug EJB Timer Store | DebugEjbTimerStore | "Containers" tab |
|Debug EJB Timers | DebugEjbTimers | "Containers" tab |
|Debug Elastic Actions | DebugElasticActions | "Diagnostics" tab |
|Debug Elastic Services | DebugElasticServices | "Diagnostics" tab |
|Debug Embedded LDAP | DebugEmbeddedLDAP | "Security" tab |
|Debug Embedded LDAP Log Level | DebugEmbeddedLDAPLogLevel | "Security" tab |
|Debug Embedded LDAP Log To Console | DebugEmbeddedLDAPLogToConsole | "Security" tab |
|Debug Embedded LDAP Write Override Props | DebugEmbeddedLDAPWriteOverrideProps | "Security" tab |
|Debug Event Manager | DebugEventManager | "Miscellaneous" tab |
|Debug Expression Bean Localizer | DebugExpressionBeanLocalizer | "Diagnostics" tab |
|Debug Expression Extensions Manager | DebugExpressionExtensionsManager | "Diagnostics" tab |
|Debug Expression Poller | DebugExpressionPoller | "Diagnostics" tab |
|Debug Fail Over | DebugFailOver | "Core" tab |
|Debug Fail Over Verbose | DebugFailOverVerbose | "Core" tab |
|Debug Federated Configuration | DebugFederatedConfig | "Management" tab |
|Debug File Change Observer | DebugFileChangeObserver | "Management" tab |
|Debug File Distribution Servlet | DebugFileDistributionServlet | "Management" tab |
|Debug File Owner Fixer | DebugFileOwnerFixer | "Core" tab |
|Debug Generic Method Descriptor | DebugGenericMethodDescriptor | "Application" tab |
|Debug Harvester Type Info Cache | DebugHarvesterTypeInfoCache | "Diagnostics" tab |
|Debug Health | DebugHealth | "Core" tab |
|Debug Health Check | DebugHealthCheck | "Core" tab |
|Debug Health Score | DebugHealthScore | "Core" tab |
|Debug HK2 Statistics | DebugHk2Statistics | "Core" tab |
|Debug HTTP 2 Send Window Size | DebugHttp2SendWindowSize | "Containers" tab |
|Debug HTTP | DebugHttp | "Containers" tab |
|Debug HTTP Concise | DebugHttpConcise | "Containers" tab |
|Debug HTTP Logging | DebugHttpLogging | "Containers" tab |
|Debug HTTP Sessions | DebugHttpSessions | "Containers" tab |
|Debug HTTP Sessions Concise | DebugHttpSessionsConcise | "Containers" tab |
|Debug IIOP | DebugIIOP | "Network" tab |
|Debug IIOP Connection | DebugIIOPConnection | "Network" tab |
|Debug IIOP Marshal | DebugIIOPMarshal | "Network" tab |
|Debug IIOP Naming | DebugIIOPNaming | "Network" tab |
|Debug IIOPOTS | DebugIIOPOTS | "Network" tab |
|Debug IIOP Replacer | DebugIIOPReplacer | "Network" tab |
|Debug IIOP Security | DebugIIOPSecurity | "Network" tab |
|Debug IIOP Startup | DebugIIOPStartup | "Network" tab |
|Debug IIOP Transport | DebugIIOPTransport | "Network" tab |
|Debug IIOP Tunneling | DebugIIOPTunneling | "Network" tab |
|Debug IIOP Detail | DebugIiopDetail | "Network" tab |
|Debug Interceptors | DebugInterceptors | "Containers" tab |
|Debug J2EE Management | DebugJ2EEManagement | "Management" tab |
|Debug JAXP Debug Level | DebugJAXPDebugLevel | "Miscellaneous" tab |
|Debug JAXP Debug Name | DebugJAXPDebugName | "Miscellaneous" tab |
|Debug JAXP Include Class | DebugJAXPIncludeClass | "Miscellaneous" tab |
|Debug JAXP Include Location | DebugJAXPIncludeLocation | "Miscellaneous" tab |
|Debug JAXP Include Name | DebugJAXPIncludeName | "Miscellaneous" tab |
|Debug JAXP Include Time | DebugJAXPIncludeTime | "Miscellaneous" tab |
|Debug JAXP Use Short Class | DebugJAXPUseShortClass | "Miscellaneous" tab |
|Debug JDBC Connection | DebugJDBCConn | "Persistence" tab |
|Debug JDBC Driver Logging | DebugJDBCDriverLogging | "Persistence" tab |
|Debug JDBC Internal | DebugJDBCInternal | "Persistence" tab |
|Debug JDBC RMI | DebugJDBCRMI | "Persistence" tab |
|Debug JDBC SQL | DebugJDBCSQL | "Persistence" tab |
|Debug JMS Back End | DebugJMSBackEnd | "Messaging" tab |
|Debug JMS Boot | DebugJMSBoot | "Messaging" tab |
|Debug JMS Component Invocation Context Helper | DebugJmscicHelper | "Messaging" tab |
|Debug JMS Common | DebugJMSCommon | "Messaging" tab |
|Debug JMS Configuration | DebugJMSConfig | "Messaging" tab |
|Debug JMS Dispatcher | DebugJMSDispatcher | "Messaging" tab |
|Debug JMS Dispatcher Lifecycle | DebugJmsDispatcherLifecycle | "Messaging" tab |
|Debug JMS Dispatcher RMI | DebugJmsDispatcherRmi | "Messaging" tab |
|Debug JMS Dispatcher Wire | DebugJmsDispatcherWire | "Messaging" tab |
|Debug JMS Distributed Topic | DebugJMSDistTopic | "Messaging" tab |
|Debug JMS Front End | DebugJMSFrontEnd | "Messaging" tab |
|Debug JMS Invocable Verbose | DebugJmsInvocableVerbose | "Messaging" tab |
|Debug JMS JDBC Scavenge On Flush | DebugJMSJDBCScavengeOnFlush | "Messaging" tab |
|Debug JMS Locking | DebugJMSLocking | "Messaging" tab |
|Debug JMS Message Path | DebugJMSMessagePath | "Messaging" tab |
|Debug JMS Module | DebugJMSModule | "Messaging" tab |
|Debug JMS Pause Resume | DebugJMSPauseResume | "Messaging" tab |
|Debug JMS SAF | DebugJMSSAF | "Messaging" tab |
|Debug JMS Wrappers | DebugJMSWrappers | "Messaging" tab |
|Debug JMS XA | DebugJMSXA | "Messaging" tab |
|Debug JMX | DebugJMX | "Management" tab |
|Debug JMX Core | DebugJMXCore | "Management" tab |
|Debug JMX Domain | DebugJMXDomain | "Management" tab |
|Debug JMX Edit | DebugJMXEdit | "Management" tab |
|Debug JMX Runtime | DebugJMXRuntime | "Management" tab |
|Debug JNDI | DebugJNDI | "Core" tab |
|Debug JNDI Factories | DebugJNDIFactories | "Core" tab |
|Debug JNDI Resolution | DebugJNDIResolution | "Core" tab |
|Debug JTA 2PC | DebugJTA2PC | "Transactions" tab |
|Debug JTA 2PC Stack Trace | DebugJTA2PCStackTrace | "Transactions" tab |
|Debug JTA API | DebugJTAAPI | "Transactions" tab |
|Debug JTA Gateway | DebugJTAGateway | "Transactions" tab |
|Debug JTA Gateway Stack Trace | DebugJTAGatewayStackTrace | "Transactions" tab |
|Debug JTA Health | DebugJTAHealth | "Transactions" tab |
|Debug JTA JDBC | DebugJTAJDBC | "Transactions" tab |
|Debug JTA Last Logging Resource (LLR) | DebugJTALLR | "Transactions" tab |
|Debug JTA Lifecycle | DebugJTALifecycle | "Transactions" tab |
|Debug JTA Migration | DebugJTAMigration | "Transactions" tab |
|Debug JTA Naming | DebugJTANaming | "Transactions" tab |
|Debug JTA Naming Stack Trace | DebugJTANamingStackTrace | "Transactions" tab |
|Debug JTA Non XA | DebugJTANonXA | "Transactions" tab |
|Debug JTA Peer Site Recovery | DebugJtaPeerSiteRecovery | "Transactions" tab |
|Debug JTA Propagate | DebugJTAPropagate | "Transactions" tab |
|Debug JTA RMI | DebugJTARMI | "Transactions" tab |
|Debug JTA Recovery | DebugJTARecovery | "Transactions" tab |
|Debug JTA Recovery Stack Trace | DebugJTARecoveryStackTrace | "Transactions" tab |
|Debug JTA Resource Health | DebugJTAResourceHealth | "Transactions" tab |
|Debug JTA Resource Name | DebugJTAResourceName | "Transactions" tab |
|Debug JTA Transaction Log (TLOG) | DebugJTATLOG | "Transactions" tab |
|Debug JTA XA | DebugJTAXA | "Transactions" tab |
|Debug JTA XA Stack Trace | DebugJTAXAStackTrace | "Transactions" tab |
|Debug JVMID | DebugJvmid | "Core" tab |
|Debug JDBC Replay | DebugJdbcReplay | "Persistence" tab |
|Debug JDBC ONS | DebugJdbcons | "Persistence" tab |
|Debug JDBC RAC | DebugJdbcrac | "Persistence" tab |
|Debug JDBC Universal Connection Pool (UCP) | DebugJdbcucp | "Persistence" tab |
|Debug JMS Client | DebugJmsClient | "Messaging" tab |
|Debug JMS Client Stack Trace | DebugJmsClientStackTrace | "Messaging" tab |
|Debug JMS Cross Domain Security | DebugJmsCrossDomainSecurity | "Messaging" tab |
|Debug JMS Dispatcher Proxy | DebugJmsDispatcherProxy | "Messaging" tab |
|Debug JMS Dispatcher Utilities Verbose | DebugJmsDispatcherUtilsVerbose | "Messaging" tab |
|Debug JMS Dispatcher Verbose | DebugJmsDispatcherVerbose | "Messaging" tab |
|Debug JMS DotNet Proxy | DebugJmsDotNetProxy | "Messaging" tab |
|Debug JMS DotNet T3 Server | DebugJmsDotNetT3Server | "Messaging" tab |
|Debug JMS DotNet Transport | DebugJmsDotNetTransport | "Messaging" tab |
|Debug JMS Durable Subscribers (DurSub) | DebugJmsDurSub | "Messaging" tab |
|Debug JMS Store | DebugJmsStore | "Messaging" tab |
|Debug JMS Continuous Data Services (CDS) | DebugJmscds | "Messaging" tab |
|Debug JMS JNDI | DebugJmsjndi | "Messaging" tab |
|Debug JMS Observer | DebugJmsobs | "Messaging" tab |
|Debug JMS T3 Server | DebugJmst3Server | "Messaging" tab |
|Debug JMX Compatibility | DebugJmxCompatibility | "Management" tab |
|Debug JMX Context | DebugJmxContext | "Management" tab |
|Debug JMX Core Concise | DebugJmxCoreConcise | "Management" tab |
|Debug JPA | DebugJpa | "Persistence" tab |
|Debug JPA Data Cache | DebugJpaDataCache | "Persistence" tab |
|Debug JPA Enhance | DebugJpaEnhance | "Persistence" tab |
|Debug JPA JDBC JDBC | DebugJpaJdbcJdbc | "Persistence" tab |
|Debug JPA JDBC Schema | DebugJpaJdbcSchema | "Persistence" tab |
|Debug JPA JDBC SQL | DebugJpaJdbcSql | "Persistence" tab |
|Debug JPA Management/Monitoring | DebugJpaManage | "Persistence" tab |
|Debug JPA Metadata | DebugJpaMetaData | "Persistence" tab |
|Debug JPA Profile | DebugJpaProfile | "Persistence" tab |
|Debug JPA Query | DebugJpaQuery | "Persistence" tab |
|Debug JPA Runtime | DebugJpaRuntime | "Persistence" tab |
|Debug JPA Tool | DebugJpaTool | "Persistence" tab |
|Debug JTA 2 PC Detail | DebugJta2PcDetail | "Transactions" tab |
|Debug JTA Contexts and Dependency Injection (CDI), | DebugJtacdi | "Transactions" tab |
|Debug Kernel | DebugKernel | "Core" tab |
|Debug Kodo WebLogic | DebugKodoWeblogic | "Persistence" tab |
|Debug Leader Election | DebugLeaderElection | "Core" tab |
|Debug Legacy | DebugLegacy | "Security" tab |
|Debug Libraries | DebugLibraries | "Application" tab |
|Debug Lifecycle Manager | DebugLifecycleManager | "Core" tab |
|Debug Load Balancing | DebugLoadBalancing | "Core" tab |
|Debug Local Remote Jvm | DebugLocalRemoteJvm | "Core" tab |
|Debug Logging Configuration | DebugLoggingConfiguration | "Diagnostics" tab |
|Debug MBean Event Handler | DebugMBeanEventHandler | "Diagnostics" tab |
|Debug MBean Event Handler Summary | DebugMBeanEventHandlerSummary | "Diagnostics" tab |
|Debug MBean Event Handler Work | DebugMBeanEventHandlerWork | "Diagnostics" tab |
|Debug MBean Harvester Control | DebugMBeanHarvesterControl | "Diagnostics" tab |
|Debug MBean Harvester Data Collection | DebugMBeanHarvesterDataCollection | "Diagnostics" tab |
|Debug MBean Harvester Resolution | DebugMBeanHarvesterResolution | "Diagnostics" tab |
|Debug MBean Harvester Threading | DebugMBeanHarvesterThreading | "Diagnostics" tab |
|Debug MBean Localization | DebugMBeanLocalization | "Management" tab |
|Debug MBean Type Utility Queue | DebugMBeanTypeUtilQueue | "Diagnostics" tab |
|Debug MBean Type Utility Queue Priority | DebugMBeanTypeUtilQueuePriority | "Diagnostics" tab |
|Debug MBean Type Utility Listener | DebugMBeanTypeUtilityListener | "Diagnostics" tab |
|Debug MBean Typing Utility | DebugMBeanTypingUtility | "Diagnostics" tab |
|Debug Mail Session Deployment | DebugMailSessionDeployment | "Application" tab |
|Debug Managed Bean | DebugManagedBean | "Application" tab |
|Debug Management Services Resource | DebugManagementServicesResource | "Management" tab |
|Debug Mask Criteria | DebugMaskCriteria | "Miscellaneous" tab |
|Debug Messaging | DebugMessaging | "Core" tab |
|Debug Messaging Bridge Runtime | DebugMessagingBridgeRuntime | "Messaging" tab |
|Debug Messaging Bridge Runtime Verbose | DebugMessagingBridgeRuntimeVerbose | "Messaging" tab |
|Debug Messaging Bridge Startup | DebugMessagingBridgeStartup | "Messaging" tab |
|Debug Messaging Kernel | DebugMessagingKernel | "Messaging" tab |
|Debug Messaging Kernel Boot | DebugMessagingKernelBoot | "Messaging" tab |
|Debug Messaging Kernel Verbose | DebugMessagingKernelVerbose | "Messaging" tab |
|Debug Messaging Ownable Lock | DebugMessagingOwnableLock | "Messaging" tab |
|Debug Migration Info | DebugMigrationInfo | "Management" tab |
|Debug Muxer | DebugMuxer | "Core" tab |
|Debug Muxer Concise | DebugMuxerConcise | "Core" tab |
|Debug Muxer Connection | DebugMuxerConnection | "Core" tab |
|Debug Muxer Detail | DebugMuxerDetail | "Core" tab |
|Debug Muxer Exception | DebugMuxerException | "Core" tab |
|Debug Muxer Timeout | DebugMuxerTimeout | "Core" tab |
|Debug NIO | DebugNio | "Core" tab |
|Debug Node Manager Runtime | DebugNodeManagerRuntime | "Core" tab |
|Debug OPatch Utilities | DebugOPatchUtils | "Management" tab |
|Debug Page Flow Monitoring | DebugPageFlowMonitoring | "Miscellaneous" tab |
|Debug Parameters | DebugParameters | "Core" tab |
|Debug Patching Runtime | DebugPatchingRuntime | "Management" tab |
|Debug Path Service | DebugPathSvc | "Messaging" tab |
|Debug Path Service Verbose | DebugPathSvcVerbose | "Messaging" tab |
|Debug Persistent Store Manager | DebugPersistentStoreManager | "Persistence" tab |
|Debug Pub/Sub Bayeux | DebugPubSubBayeux | "Containers" tab |
|Debug Pub/Sub Channel | DebugPubSubChannel | "Containers" tab |
|Debug Pub/Sub Client | DebugPubSubClient | "Containers" tab |
|Debug Pub/Sub MBean | DebugPubSubMBean | "Containers" tab |
|Debug Pub/Sub Security | DebugPubSubSecurity | "Containers" tab |
|Debug Pub/Sub Server | DebugPubSubServer | "Containers" tab |
|Debug Resource Adapter | DebugRA | "Containers" tab |
|Debug Resource Adapter Connection Events | DebugRAConnEvents | "Containers" tab |
|Debug Resource Adapter Connections | DebugRAConnections | "Containers" tab |
|Debug Resource Adapter Deployment | DebugRADeployment | "Containers" tab |
|Debug Resource Adapter Lifecycle | DebugRALifecycle | "Containers" tab |
|Debug Resource Adapter Local Out | DebugRALocalOut | "Containers" tab |
|Debug Resource Adapter Parsing | DebugRAParsing | "Containers" tab |
|Debug Resource Adapter Pool Verbose | DebugRAPoolVerbose | "Containers" tab |
|Debug RA Pooling | DebugRAPooling | "Containers" tab |
|Debug Resource Adapter Security Ctx | DebugRASecurityCtx | "Containers" tab |
|Debug Resource Adapter Work | DebugRAWork | "Containers" tab |
|Debug Resource Adapter Work Events | DebugRAWorkEvents | "Containers" tab |
|Debug Resource Adapter XA in | DebugRAXAin | "Containers" tab |
|Debug Resource Adapter XA out | DebugRAXAout | "Containers" tab |
|Debug Resource Adapter XA work | DebugRAXAwork | "Containers" tab |
|Debug RC4 | DebugRC4 | "Security" tab |
|Debug RSA | DebugRSA | "Security" tab |
|Debug Resource Adapter Classloader | DebugRaClassloader | "Containers" tab |
|Debug ReadyApp | DebugReadyApp | "Application" tab |
|Debug Redefinition Attach | DebugRedefAttach | "Core" tab |
|Debug Replication | DebugReplication | "Core" tab |
|Debug Replication Details | DebugReplicationDetails | "Core" tab |
|Debug Replication Size | DebugReplicationSize | "Core" tab |
|Debug Request Manager | DebugRequestManager | "Core" tab |
|Debug REST Jersey 1 Integration | DebugRestJersey1Integration | "Containers" tab |
|Debug REST Jersey 2 Integration | DebugRestJersey2Integration | "Containers" tab |
|Debug REST Notifications | DebugRestNotifications | "Diagnostics" tab |
|Debug Restart In Place | DebugRestartInPlace | "Core" tab |
|Debug RJVM Request Response | DebugRjvmRequestResponse | "Core" tab |
|Debug RMI Detailed | DebugRmiDetailed | "Core" tab |
|Debug RMI Request Performance | DebugRmiRequestPerf | "Core" tab |
|Debug Routing | DebugRouting | "Core" tab |
|Debug SAF Admin | DebugSAFAdmin | "Messaging" tab |
|Debug SAF Life Cycle | DebugSAFLifeCycle | "Messaging" tab |
|Debug SAF Manager | DebugSAFManager | "Messaging" tab |
|Debug SAF Message Path | DebugSAFMessagePath | "Messaging" tab |
|Debug SAF Receiving Agent | DebugSAFReceivingAgent | "Messaging" tab |
|Debug SAF Sending Agent | DebugSAFSendingAgent | "Messaging" tab |
|Debug SAF Store | DebugSAFStore | "Messaging" tab |
|Debug SAF Transport | DebugSAFTransport | "Messaging" tab |
|Debug SAF Verbose | DebugSAFVerbose | "Messaging" tab |
|Debug SSL | DebugSSL | "Security" tab |
|Debug SCA Container | DebugScaContainer | "Containers" tab |
|Debug Scrubber Start Service | DebugScrubberStartService | "Core" tab |
|Debug Security | DebugSecurity | "Security" tab |
|Debug Security Adjudicator | DebugSecurityAdjudicator | "Security" tab |
|Debug Security Authentication (ATN) | DebugSecurityAtn | "Security" tab |
|Debug Security Authorization (ATZ) | DebugSecurityAtz | "Security" tab |
|Debug Security Auditor | DebugSecurityAuditor | "Security" tab |
|Debug Security Certificate Path | DebugSecurityCertPath | "Security" tab |
|Debug Security Credential Mapping | DebugSecurityCredMap | "Security" tab |
|Debug Security Entitlements Engine | DebugSecurityEEngine | "Security" tab |
|Debug Security Encryption Service | DebugSecurityEncryptionService | "Security" tab |
|Debug Security JACC | DebugSecurityJACC | "Security" tab |
|Debug Security JACC Non-Policy | DebugSecurityJACCNonPolicy | "Security" tab |
|Debug Security JACC Policy | DebugSecurityJACCPolicy | "Security" tab |
|Debug Security Keystore | DebugSecurityKeyStore | "Security" tab |
|Debug Security Password Policy | DebugSecurityPasswordPolicy | "Security" tab |
|Debug Security Predicate | DebugSecurityPredicate | "Security" tab |
|Debug Security Realm | DebugSecurityRealm | "Security" tab |
|Debug Security Role Map | DebugSecurityRoleMap | "Security" tab |
|Debug Security SAML Authentication (ATN) | DebugSecuritySAMLAtn | "Security" tab |
|Debug Security SAML Credential Mapping | DebugSecuritySAMLCredMap | "Security" tab |
|Debug Security SAML Lib | DebugSecuritySAMLLib | "Security" tab |
|Debug Security SSL | DebugSecuritySSL | "Security" tab |
|Debug Security SSL Eaten | DebugSecuritySSLEaten | "Security" tab |
|Debug Security SAML 2 Authentication (ATN) | DebugSecuritySaml2Atn | "Security" tab |
|Debug Security SAML 2 Credential Mapping | DebugSecuritySaml2CredMap | "Security" tab |
|Debug Security SAML 2 Lib | DebugSecuritySaml2Lib | "Security" tab |
|Debug Security SAML 2 Service | DebugSecuritySaml2Service | "Security" tab |
|Debug Security SAML Service | DebugSecuritySamlService | "Security" tab |
|Debug Security Service | DebugSecurityService | "Security" tab |
|Debug Security User Lockout | DebugSecurityUserLockout | "Security" tab |
|Debug Self Tuning | DebugSelfTuning | "Core" tab |
|Debug Server Life Cycle | DebugServerLifeCycle | "Core" tab |
|Debug Server Migration | DebugServerMigration | "Core" tab |
|Debug Server Runtime | DebugServerRuntime | "Core" tab |
|Debug Server Shutdown Handler | DebugServerShutdownHandler | "Core" tab |
|Debug Server Shutdown Statistics | DebugServerShutdownStatistics | "Core" tab |
|Debug Server Shutdown Timer | DebugServerShutdownTimer | "Core" tab |
|Debug Server Start Statistics | DebugServerStartStatistics | "Core" tab |
|Debug Server Startup Timer | DebugServerStartupTimer | "Core" tab |
|Debug Singleton Services | DebugSingletonServices | "Core" tab |
|Debug Singleton Services Concise | DebugSingletonServicesConcise | "Core" tab |
|Debug Situational Config | DebugSituationalConfig | "Management" tab |
|Debug SNMP Agent | DebugSnmpAgent | "Diagnostics" tab |
|Debug SNMP Extension Provider | DebugSnmpExtensionProvider | "Diagnostics" tab |
|Debug SNMP MIB | DebugSnmpMib | "Diagnostics" tab |
|Debug SNMP Protocol TCP | DebugSnmpProtocolTcp | "Diagnostics" tab |
|Debug SNMP Toolkit | DebugSnmpToolkit | "Diagnostics" tab |
|Debug Spring MBeans | DebugSpringMBeans | "Containers" tab |
|Debug Spring Statistics | DebugSpringStatistics | "Containers" tab |
|Debug Store | DebugStore | "Persistence" tab |
|Debug Store Admin | DebugStoreAdmin | "Persistence" tab |
|Debug Store Cache | DebugStoreCache | "Persistence" tab |
|Debug Store Connection Caching | DebugStoreConnectionCaching | "Persistence" tab |
|Debug Store I/O Logical | DebugStoreIOLogical | "Persistence" tab |
|Debug Store I/O Logical Boot | DebugStoreIOLogicalBoot | "Persistence" tab |
|Debug Store I/O Physical | DebugStoreIOPhysical | "Persistence" tab |
|Debug Store I/O Physical Verbose | DebugStoreIOPhysicalVerbose | "Persistence" tab |
|Debug Store Replication and Consistency Manager (RCM) | DebugStoreRcm | "Persistence" tab |
|Debug Store Replication and Consistency Manager (RCM) Verbose | DebugStoreRcmVerbose | "Persistence" tab |
|Debug Store XA | DebugStoreXA | "Persistence" tab |
|Debug Store XA Verbose | DebugStoreXAVerbose | "Persistence" tab |
|Debug Stub Generation | DebugStubGeneration | "Core" tab |
|Debug Tunneling Connection | DebugTunnelingConnection | "Core" tab |
|Debug Tunneling Connection Timeout | DebugTunnelingConnectionTimeout | "Core" tab |
|Debug URL Resolution | DebugURLResolution | "Containers" tab |
|Debug Unicast Messaging | DebugUnicastMessaging | "Core" tab |
|Debug Validate Work Manager | DebugValidateWorkManager | "Management" tab |
|Debug Validation | DebugValidation | "Application" tab |
|Debug Validation Class Loading | DebugValidationClassLoading | "Application" tab |
|Debug WAN Replication Details | DebugWANReplicationDetails | "Containers" tab |
|Debug WAR Extraction | DebugWarExtraction | "Containers" tab |
|Debug Watch Scaling Actions | DebugWatchScalingActions | "Diagnostics" tab |
|Debug Web App Dependency Injection | DebugWebAppDi | "Containers" tab |
|Debug Web App Identity Assertion | DebugWebAppIdentityAssertion | "Containers" tab |
|Debug Web App Module | DebugWebAppModule | "Containers" tab |
|Debug Web App Security | DebugWebAppSecurity | "Containers" tab |
|Debug Web Socket | DebugWebSocket | "Core" tab |
|Debug Work Context | DebugWorkContext | "Core" tab |
|Debug WTC tBridge Execution | DebugWtCtBridgeEx | "Miscellaneous" tab |
|Debug WTC Configuration | DebugWtcConfig | "Miscellaneous" tab |
|Debug WTC CORBA Execution | DebugWtcCorbaEx | "Miscellaneous" tab |
|Debug WTC Gateway Execution | DebugWtcGwtEx | "Miscellaneous" tab |
|Debug WTC JATMI Execution | DebugWtcJatmiEx | "Miscellaneous" tab |
|Debug WTC Tdom PDU | DebugWtcTdomPdu | "Miscellaneous" tab |
|Debug WTC tDom PDU | DebugWtctDomPdu | "Miscellaneous" tab |
|Debug WTC User Data | DebugWtcuData | "Miscellaneous" tab |
|Debug XML Entity Cache Debug Level | DebugXMLEntityCacheDebugLevel | "Miscellaneous" tab |
|Debug XML Entity Cache Debug Name | DebugXMLEntityCacheDebugName | "Miscellaneous" tab |
|Debug XML Entity Cache Include Class | DebugXMLEntityCacheIncludeClass | "Miscellaneous" tab |
|Debug XML Entity Cache Include Location | DebugXMLEntityCacheIncludeLocation | "Miscellaneous" tab |
|Debug XML Entity Cache Include Name | DebugXMLEntityCacheIncludeName | "Miscellaneous" tab |
|Debug XML Entity Cache Include Time | DebugXMLEntityCacheIncludeTime | "Miscellaneous" tab |
|Debug XML Entity Cache Use Short Class | DebugXMLEntityCacheUseShortClass | "Miscellaneous" tab |
|Debug XML Registry Debug Level | DebugXMLRegistryDebugLevel | "Miscellaneous" tab |
|Debug XML Registry Debug Name | DebugXMLRegistryDebugName | "Miscellaneous" tab |
|Debug XML Registry Include Class | DebugXMLRegistryIncludeClass | "Miscellaneous" tab |
|Debug XML Registry Include Location | DebugXMLRegistryIncludeLocation | "Miscellaneous" tab |
|Debug XML Registry Include Name | DebugXMLRegistryIncludeName | "Miscellaneous" tab |
|Debug XML Registry Include Time | DebugXMLRegistryIncludeTime | "Miscellaneous" tab |
|Debug XML Registry Use Short Class | DebugXMLRegistryUseShortClass | "Miscellaneous" tab |
|Default RJVM Diag Messages | DefaultRjvmDiagMessages | "Core" tab |
|Default Store | DefaultStore | "Application" tab |
|Deployment State | DeploymentState | "Application" tab |
|Diagnostic Context Debug Mode | DiagnosticContextDebugMode | "Diagnostics" tab |
|Force GC Each Distributed GC Period | ForceGCEachDGCPeriod | "Core" tab |
|Force Shutdown Timeout Number of Thread Dumps | ForceShutdownTimeoutNumOfThreadDump | "Core" tab |
|Force Shutdown Timeout Thread Dump Interval | ForceShutdownTimeoutThreadDumpInterval | "Core" tab |
|Glass Fish Web App Parser | GlassFishWebAppParser | "Containers" tab |
|Graceful Shutdown Timeout Number Of Thread Dumps | GracefulShutdownTimeoutNumOfThreadDump | "Core" tab |
|Graceful Shutdown Timeout Thread Dump Interval | GracefulShutdownTimeoutThreadDumpInterval | "Core" tab |
|Listen Thread Debug | ListenThreadDebug | "Core" tab |
|Log Distributed GC Statistics | LogDGCStatistics | "Core" tab |
|Magic Thread Dump Back To Socket | MagicThreadDumpBackToSocket | "Management" tab |
|Magic Thread Dump Enabled | MagicThreadDumpEnabled | "Management" tab |
|Magic Thread Dump File | MagicThreadDumpFile | "Management" tab |
|Magic Thread Dump Host | MagicThreadDumpHost | "Management" tab |
|Master Deployer | MasterDeployer | "Application" tab |
|OSGI For Applications | OsGiForApps | "Application" tab |
|Redefining Class Loader | RedefiningClassLoader | "Application" tab |
|Script Executor Command | ScriptExecutorCommand | "Diagnostics" tab |
|Security Encryption Service | SecurityEncryptionService | "Security" tab |
|Server Helper | ServerHelper | "Core" tab |
|Slave Deployer | SlaveDeployer | "Application" tab |
|Startup Timeout Number Of Thread Dumps | StartupTimeoutNumOfThreadDump | "Core" tab |
|Startup Timeout Thread Dump Interval | StartupTimeoutThreadDumpInterval | "Core" tab |
|T3 HTTP Upgrade Handler | T3HttpUpgradeHandler | "Containers" tab |
|WAR Extraction | WarExtraction | "Containers" tab |
|Web Module | WebModule | "Containers" tab |
|Web RJVM Support | WebRjvmSupport | "Containers" tab |

### Server / ServerDebug / DebugScope
Navigate to: Topology => Servers => (instance) => Server Debug => Debug Scopes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Notes | Notes |  |

### Server / ServerDiagnosticConfig
Navigate to: Topology => Servers => (instance) => Server Diagnostic Config

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Data Retirement Enabled | DataRetirementEnabled | "General" tab |
|Diagnostic Data Archive Type | DiagnosticDataArchiveType | "General" tab |
|Diagnostic Dumps Directory | DiagnosticDumpsDir | "General" tab => "Advanced" collapsible |
|Diagnostic JDBC Resource | DiagnosticJDBCResource | "General" tab |
|Diagnostic JDBC Schema Name | DiagnosticJdbcSchemaName | "General" tab |
|Diagnostic Store Block Size | DiagnosticStoreBlockSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Directory | DiagnosticStoreDir | "General" tab |
|Diagnostic Store File Locking Enabled | DiagnosticStoreFileLockingEnabled | "General" tab |
|Diagnostic Store I/O Buffer Size | DiagnosticStoreIoBufferSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Max File Size | DiagnosticStoreMaxFileSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Max Window Buffer Size | DiagnosticStoreMaxWindowBufferSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Min Window Buffer Size | DiagnosticStoreMinWindowBufferSize | "General" tab => "Advanced" collapsible |
|Event Persistence Interval | EventPersistenceInterval | "General" tab => "Advanced" collapsible |
|Events Image Capture Interval | EventsImageCaptureInterval | "General" tab => "Advanced" collapsible |
|Image Directory | ImageDir | "General" tab => "Advanced" collapsible |
|Image Timeout | ImageTimeout | "General" tab => "Advanced" collapsible |
|Max Heap Dump Count | MaxHeapDumpCount | "General" tab => "Advanced" collapsible |
|Max Thread Dump Count | MaxThreadDumpCount | "General" tab => "Advanced" collapsible |
|Notes | Notes | "General" tab |
|Preferred Store Size Limit | PreferredStoreSizeLimit | "General" tab |
|Store Size Check Period | StoreSizeCheckPeriod | "General" tab |
|Synchronous Event Persistence Enabled | SynchronousEventPersistenceEnabled | "General" tab => "Advanced" collapsible |
|WLDF Builtin System Resource Type | WldfBuiltinSystemResourceType | "General" tab |
|WLDF Diagnostic Volume | WldfDiagnosticVolume | "General" tab |

### Server / ServerDiagnosticConfig / WldfBuiltinWatchConfiguration
Navigate to: Topology => Servers => (instance) => Server Diagnostic Config => WLDF Builtin Watch Configuration

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Stuck Thread Diagnostic Image Notification Enabled | StuckThreadDiagnosticImageNotificationEnabled |  |
|Stuck Thread Thread Dump Action Count | StuckThreadThreadDumpActionCount |  |
|Stuck Thread Thread Dump Action Delay Seconds | StuckThreadThreadDumpActionDelaySeconds |  |
|Stuck Thread Thread Dump Action Enabled | StuckThreadThreadDumpActionEnabled |  |
|Stuck Thread Watch Enabled | StuckThreadWatchEnabled |  |

### Server / ServerStart
Navigate to: Topology => Servers => (instance) => Server Start

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Arguments | Arguments |  |
|Class Path | ClassPath |  |
|Java Home | JavaHome |  |
|Java Vendor | JavaVendor |  |
|Middleware Home | MwHome |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Root Directory | RootDirectory |  |
|Security Policy File | SecurityPolicyFile |  |
|Username | Username |  |

### Server / SingleSignOnServices
Navigate to: Topology => Servers => (instance) => Single Sign-On Services

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allowed Target Hosts | AllowedTargetHost | "SAML 2.0 Service Provider" tab |
|Artifact Max Cache Size | ArtifactMaxCacheSize | "SAML 2.0 General" tab |
|Artifact Timeout | ArtifactTimeout | "SAML 2.0 General" tab |
|Assertion Encryption Decryption Key Alias | AssertionEncryptionDecryptionKeyAlias | "SAML 2.0 Service Provider" tab |
|Assertion Encryption Decryption Key Passphrase | AssertionEncryptionDecryptionKeyPassPhraseEncrypted | "SAML 2.0 Service Provider" tab |
|Assertion Encryption Enabled | AssertionEncryptionEnabled | "SAML 2.0 Identity Provider" tab |
|Assertion Subject Session Timeout Check Enabled | AssertionSubjectSessionTimeoutCheckEnabled | "SAML 2.0 Service Provider" tab |
|Authentication Request Max Cache Size | AuthnRequestMaxCacheSize | "SAML 2.0 Service Provider" tab |
|Authentication Request Timeout | AuthnRequestTimeout | "SAML 2.0 Service Provider" tab |
|Basic Auth Password | BasicAuthPasswordEncrypted | "SAML 2.0 General" tab |
|Basic Auth Username | BasicAuthUsername | "SAML 2.0 General" tab |
|Contact Person Company | ContactPersonCompany | "SAML 2.0 General" tab |
|Contact Person Email Address | ContactPersonEmailAddress | "SAML 2.0 General" tab |
|Contact Person Given Name | ContactPersonGivenName | "SAML 2.0 General" tab |
|Contact Person Surname | ContactPersonSurName | "SAML 2.0 General" tab |
|Contact Person Telephone Number | ContactPersonTelephoneNumber | "SAML 2.0 General" tab |
|Contact Person Type | ContactPersonType | "SAML 2.0 General" tab |
|Data Encryption Algorithm | DataEncryptionAlgorithm | "SAML 2.0 Identity Provider" tab |
|Default URL | DefaultUrl | "SAML 2.0 Service Provider" tab |
|Entity ID | EntityId | "SAML 2.0 General" tab |
|Force Authentication | ForceAuthn | "SAML 2.0 Service Provider" tab |
|Identity Provider Artifact Binding Enabled | IdentityProviderArtifactBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Enabled | IdentityProviderEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Post Binding Enabled | IdentityProviderPostBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Preferred Binding | IdentityProviderPreferredBinding | "SAML 2.0 Identity Provider" tab |
|Identity Provider Redirect Binding Enabled | IdentityProviderRedirectBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Key Encryption Algorithm | KeyEncryptionAlgorithm | "SAML 2.0 Identity Provider" tab |
|Login Return Query Parameter | LoginReturnQueryParameter | "SAML 2.0 Identity Provider" tab |
|Login URL | LoginUrl | "SAML 2.0 Identity Provider" tab |
|Metadata Encryption Algorithms | MetadataEncryptionAlgorithm | "SAML 2.0 Service Provider" tab |
|Notes | Notes | "SAML 2.0 General" tab |
|Organization Name | OrganizationName | "SAML 2.0 General" tab |
|Organization URL | OrganizationUrl | "SAML 2.0 General" tab |
|Passive | Passive | "SAML 2.0 Service Provider" tab |
|Post One-Use Check Enabled | PostOneUseCheckEnabled | "SAML 2.0 General" tab |
|Published Site URL | PublishedSiteUrl | "SAML 2.0 General" tab |
|Recipient Check Enabled | RecipientCheckEnabled | "SAML 2.0 General" tab |
|Replicated Cache Enabled | ReplicatedCacheEnabled | "SAML 2.0 General" tab |
|Service Provider Artifact Binding Enabled | ServiceProviderArtifactBindingEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Enabled | ServiceProviderEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Post Binding Enabled | ServiceProviderPostBindingEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Preferred Binding | ServiceProviderPreferredBinding | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Binding | ServiceProviderSingleLogoutBinding | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Enabled | ServiceProviderSingleLogoutEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Redirect URIs | ServiceProviderSingleLogoutRedirectUri | "SAML 2.0 Service Provider" tab |
|Sign Authentication Requests | SignAuthnRequests | "SAML 2.0 Service Provider" tab |
|SSO Signing Key Alias | SsoSigningKeyAlias | "SAML 2.0 General" tab |
|SSO Signing Key Passphrase | SsoSigningKeyPassPhraseEncrypted | "SAML 2.0 General" tab |
|Transport Layer Security Key Alias | TransportLayerSecurityKeyAlias | "SAML 2.0 General" tab |
|Transport Layer Security Key Passphrase | TransportLayerSecurityKeyPassPhraseEncrypted | "SAML 2.0 General" tab |
|Want Artifact Requests Signed | WantArtifactRequestsSigned | "SAML 2.0 General" tab |
|Want Assertions Signed | WantAssertionsSigned | "SAML 2.0 Service Provider" tab |
|Want Authentication Requests Signed | WantAuthnRequestsSigned | "SAML 2.0 Identity Provider" tab |
|Want Basic Auth Client Authentication | WantBasicAuthClientAuthentication | "SAML 2.0 General" tab |
|Want Responses Signed | WantResponsesSigned | "SAML 2.0 Service Provider" tab |
|Want Transport Layer Security Client Authentication | WantTransportLayerSecurityClientAuthentication | "SAML 2.0 General" tab |

### Server / TransactionLogJDBCStore
Navigate to: Topology => Servers => (instance) => Transaction Log JDBC Store

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Caching Policy | ConnectionCachingPolicy | "Tuning Parameters" tab |
|Create Table DDL File | CreateTableDDLFile | "General" tab => "Advanced" collapsible |
|Data Source | DataSource | "General" tab |
|Deletes Per Batch Maximum | DeletesPerBatchMaximum | "Tuning Parameters" tab |
|Deletes Per Statement Maximum | DeletesPerStatementMaximum | "Tuning Parameters" tab |
|Distribution Policy | DistributionPolicy | "High Availability" tab |
|Enabled | Enabled | "General" tab |
|Failback Delay Seconds | FailbackDelaySeconds | "High Availability" tab |
|Fail Over Limit | FailOverLimit | "High Availability" tab |
|Initial Boot Delay Seconds | InitialBootDelaySeconds | "High Availability" tab |
|Inserts Per Batch Maximum | InsertsPerBatchMaximum | "Tuning Parameters" tab |
|Logical Name | LogicalName | "General" tab => "Advanced" collapsible |
|Max Retry Seconds Before TLOG Fail | MaxRetrySecondsBeforeTlogFail | "Tuning Parameters" tab |
|Max Retry Seconds Before Transaction Exception | MaxRetrySecondsBeforeTxException | "Tuning Parameters" tab |
|Migration Policy | MigrationPolicy | "High Availability" tab |
|Notes | Notes | "General" tab |
|Number Of Restart Attempts | NumberOfRestartAttempts | "High Availability" tab |
|Oracle Piggyback Commit Enabled | OraclePiggybackCommitEnabled | "Tuning Parameters" tab |
|Partial Cluster Stability Delay Seconds | PartialClusterStabilityDelaySeconds | "High Availability" tab |
|Prefix Name | PrefixName | "General" tab |
|Rebalance Enabled | RebalanceEnabled | "High Availability" tab |
|Reconnect Retry Interval Milliseconds | ReconnectRetryIntervalMillis | "High Availability" tab |
|Reconnect Retry Period Milliseconds | ReconnectRetryPeriodMillis | "High Availability" tab |
|Restart In Place | RestartInPlace | "High Availability" tab |
|Retry Interval Seconds | RetryIntervalSeconds | "Tuning Parameters" tab |
|Seconds Between Restarts | SecondsBetweenRestarts | "High Availability" tab |
|Three Step Threshold | ThreeStepThreshold | "Tuning Parameters" tab |
|Worker Count | WorkerCount | "Tuning Parameters" tab |
|Worker Preferred Batch Size | WorkerPreferredBatchSize | "Tuning Parameters" tab |
|XA Resource Name | XAResourceName | "General" tab => "Advanced" collapsible |

### Server / WebServer
Navigate to: Topology => Servers => (instance) => Web Server

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Context Path In Get Real Path | AcceptContextPathInGetRealPath |  |
|Authentication Cookie Enabled | AuthCookieEnabled | "Advanced" collapsible |
|Character Sets | Charsets | "Advanced" collapsible |
|Chunked Transfer Disabled | ChunkedTransferDisabled | "Advanced" collapsible |
|Client IP Header | ClientIpHeader |  |
|Default Web App Context Root | DefaultWebAppContextRoot |  |
|Frontend HTTP Port | FrontendHTTPPort |  |
|Frontend HTTPS Port | FrontendHTTPSPort |  |
|Frontend Host | FrontendHost |  |
|HTTPS Keep Alive Seconds | HttpsKeepAliveSecs |  |
|Keep Alive Enabled | KeepAliveEnabled |  |
|Keep Alive Seconds | KeepAliveSecs |  |
|Max Post Size | MaxPostSize |  |
|Max Post Time Secs | MaxPostTimeSecs |  |
|Max Request Parameter Count | MaxRequestParameterCount |  |
|Max Single Header Size | MaxSingleHeaderSize |  |
|Max Total Headers Size | MaxTotalHeadersSize |  |
|Notes | Notes |  |
|Overload Response Code | OverloadResponseCode | "Advanced" collapsible |
|Post Timeout Seconds | PostTimeoutSecs |  |
|Send Server Header Enabled | SendServerHeaderEnabled |  |
|Single Sign-On Disabled | SingleSignonDisabled | "Advanced" collapsible |
|URL Resources | URLResource | "Advanced" collapsible |
|Use Header Encoding | UseHeaderEncoding | "Advanced" collapsible |
|Use Highest Compatible HTTP Version | UseHighestCompatibleHTTPVersion | "Advanced" collapsible |
|WAP Enabled | WAPEnabled |  |

### Server / WebServer / WebServerLog
Navigate to: Topology => Servers => (instance) => Web Server => Web Server Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|ELF Fields | ELFFields | "Advanced" collapsible |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Format | LogFileFormat |  |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log Time In GMT | LogTimeInGMT | "Advanced" collapsible |
|Logging Enabled | LoggingEnabled |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### Server / WebService
Navigate to: Topology => Servers => (instance) => Web Service

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Callback Queue | CallbackQueue |  |
|Callback Queue MDB Run As Principal Name | CallbackQueueMdbRunAsPrincipalName |  |
|JMS Connection Factory | JmsConnectionFactory |  |
|Messaging Queue | MessagingQueue |  |
|Messaging Queue MDB Run As Principal Name | MessagingQueueMdbRunAsPrincipalName |  |
|Notes | Notes |  |

### Server / WebService / WebServiceBuffering
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Buffering

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Retry Count | RetryCount |  |
|Retry Delay | RetryDelay |  |

### Server / WebService / WebServiceBuffering / WebServiceRequestBufferingQueue
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Buffering => Web Service Request Buffering Queue

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Transaction Enabled | TransactionEnabled |  |

### Server / WebService / WebServiceBuffering / WebServiceResponseBufferingQueue
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Buffering => Web Service Response Buffering Queue

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Transaction Enabled | TransactionEnabled |  |

### Server / WebService / WebServicePersistence
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Persistence

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Logical Store Name | DefaultLogicalStoreName |  |
|Notes | Notes |  |

### Server / WebService / WebServicePersistence / WebServiceLogicalStore
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Persistence => Web Service Logical Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cleaner Interval | CleanerInterval |  |
|Default Maximum Object Lifetime | DefaultMaximumObjectLifetime |  |
|Notes | Notes |  |
|Persistence Strategy | PersistenceStrategy |  |
|Physical Store Name | PhysicalStoreName |  |
|Request Buffering Queue JNDI Name | RequestBufferingQueueJndiName |  |
|Response Buffering Queue JNDI Name | ResponseBufferingQueueJndiName |  |

### Server / WebService / WebServicePersistence / WebServicePhysicalStore
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Persistence => Web Service Physical Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Location | Location |  |
|Notes | Notes |  |
|Store Type | StoreType |  |
|Synchronous Write Policy | SynchronousWritePolicy |  |

### Server / WebService / WebServiceReliability
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Reliability

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Acknowledgement Interval | AcknowledgementInterval |  |
|Base Retransmission Interval | BaseRetransmissionInterval |  |
|Inactivity Timeout | InactivityTimeout |  |
|Non-Buffered Destination | NonBufferedDestination |  |
|Non-Buffered Source | NonBufferedSource |  |
|Notes | Notes |  |
|Retransmission Exponential Backoff | RetransmissionExponentialBackoff |  |
|Sequence Expiration | SequenceExpiration |  |

### Server / WebService / WebServiceResiliency
Navigate to: Topology => Servers => (instance) => Web Service => Web Service Resiliency

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Retry Count | RetryCount |  |
|Retry Delay | RetryDelay |  |

### ServerTemplate
Navigate to: Topology => Server Templates => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Backlog | AcceptBacklog | "Tuning" tab => "Advanced" collapsible |
|Add Work Manager Threads By CPU Count | AddWorkManagerThreadsByCpuCount | "Tuning" tab => "Advanced" collapsible |
|Admin Server Reconnect Interval Seconds | AdminReconnectIntervalSeconds | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Administration Port | AdministrationPort | "General" tab |
|Allow Shrinking Priority Request Queue | AllowShrinkingPriorityRequestQueue | "Tuning" tab => "Advanced" collapsible |
|Auto Migration Enabled | AutoMigrationEnabled | "Lifecycle" tab => "Migration" tab |
|Auto Restart | AutoRestart | "Lifecycle" tab => "Health" tab |
|Buzz Address | BuzzAddress | "Protocols" tab => "Advanced" collapsible |
|Buzz Enabled | BuzzEnabled | "Protocols" tab => "Advanced" collapsible |
|Buzz Port | BuzzPort | "Protocols" tab => "Advanced" collapsible |
|COM Enabled | COMEnabled | "Protocols" tab => "Advanced" collapsible |
|Candidate Machines | CandidateMachine | "Lifecycle" tab => "Migration" tab |
|Classpath Servlet Disabled | ClasspathServletDisabled | "Application" tab |
|Classpath Servlet Secure Mode Enabled | ClasspathServletSecureModeEnabled | "Application" tab |
|Cleanup Orphaned Sessions Enabled | CleanupOrphanedSessionsEnabled | "Cluster" tab |
|Client Certificate Proxy Enabled | ClientCertProxyEnabled | "General" tab |
|Cluster | Cluster | "General" tab |
|Cluster Weight | ClusterWeight | "Cluster" tab |
|Coherence Cluster System Resource | CoherenceClusterSystemResource | "Coherence" tab |
|Complete Message Timeout | CompleteMessageTimeout | "Protocols" tab |
|Complete Write Timeout | CompleteWriteTimeout | "Protocols" tab |
|Connect Timeout | ConnectTimeout | "Protocols" tab |
|Custom Identity Keystore File Name | CustomIdentityKeyStoreFileName | "Keystores" tab |
|Custom Identity Keystore Passphrase | CustomIdentityKeyStorePassPhraseEncrypted | "Keystores" tab |
|Custom Identity Keystore Type | CustomIdentityKeyStoreType | "Keystores" tab |
|Custom Trust Keystore File Name | CustomTrustKeyStoreFileName | "Keystores" tab |
|Custom Trust Keystore Passphrase | CustomTrustKeyStorePassPhraseEncrypted | "Keystores" tab |
|Custom Trust Keystore Type | CustomTrustKeyStoreType | "Keystores" tab |
|DGC Idle Periods Until Timeout | DGCIdlePeriodsUntilTimeout | "Tuning" tab => "Advanced" collapsible |
|Default IIOP Password | DefaultIIOPPasswordEncrypted | "Protocols" tab => "Advanced" collapsible |
|Default IIOP User | DefaultIIOPUser | "Protocols" tab => "Advanced" collapsible |
|Default Internal Servlets Disabled | DefaultInternalServletsDisabled | "Application" tab => "Advanced" collapsible |
|Default Protocol | DefaultProtocol | "Protocols" tab |
|Default Secure Protocol | DefaultSecureProtocol | "Protocols" tab |
|Default TGIOP Password | DefaultTGIOPPasswordEncrypted | "Protocols" tab => "Advanced" collapsible |
|Default TGIOP User | DefaultTGIOPUser | "Protocols" tab => "Advanced" collapsible |
|Eager Thread Local Cleanup | EagerThreadLocalCleanup | "Tuning" tab => "Advanced" collapsible |
|External DNS Name | ExternalDNSName | "General" tab => "Advanced" collapsible |
|Extra EJB Compiler Options | ExtraEjbcOptions | "Application" tab |
|Extra RMI Compiler Options | ExtraRmicOptions | "Application" tab |
|Gathered Writes Enabled | GatheredWritesEnabled | "Tuning" tab => "Advanced" collapsible |
|Graceful Shutdown Timeout | GracefulShutdownTimeout | "Lifecycle" tab => "General" tab |
|Health Check Interval Seconds | HealthCheckIntervalSeconds | "Lifecycle" tab => "Health" tab |
|Health Check Start Delay Seconds | HealthCheckStartDelaySeconds | "Lifecycle" tab => "Health" tab |
|HTTP Trace Support Enabled | HttpTraceSupportEnabled | "Protocols" tab => "Advanced" collapsible |
|HTTP Enabled | HttpdEnabled | "Protocols" tab => "Advanced" collapsible |
|IIOP Enabled | IIOPEnabled | "Protocols" tab => "Advanced" collapsible |
|Idle Connection Timeout | IdleConnectionTimeout | "Protocols" tab |
|Idle Periods Until Timeout | IdlePeriodsUntilTimeout | "Tuning" tab => "Advanced" collapsible |
|Ignore Sessions During Shutdown | IgnoreSessionsDuringShutdown | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Instrument Stack Trace Enabled | InstrumentStackTraceEnabled | "Diagnostics" tab |
|Interface Address | InterfaceAddress | "Cluster" tab |
|JDBC Last Logging Resource (LLR) Table Name | JDBCLLRTableName | "Transactions" tab |
|JMS Default Connection Factories Enabled | JMSDefaultConnectionFactoriesEnabled | "Application" tab |
|JNDI Transportable Object Factory List | JNDITransportableObjectFactoryList | "Application" tab => "Advanced" collapsible |
|Java Compiler | JavaCompiler | "Application" tab |
|Java Compiler Post Class Path | JavaCompilerPostClassPath | "Application" tab |
|Java Compiler Pre Class Path | JavaCompilerPreClassPath | "Application" tab |
|Java Standard Trust Keystore Passphrase | JavaStandardTrustKeyStorePassPhraseEncrypted | "Keystores" tab |
|JMS Connection Factory Unmapped Resource Reference Mode | JmsConnectionFactoryUnmappedResRefMode | "Application" tab => "Advanced" collapsible |
|Keystores | KeyStores | "Keystores" tab |
|Listen Address | ListenAddress | "General" tab |
|Listen Port | ListenPort | "General" tab |
|Listen Port Enabled | ListenPortEnabled | "General" tab |
|Listen Thread Start Delay Secs | ListenThreadStartDelaySecs | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Listeners Bind Early | ListenersBindEarly | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Log Critical Remote Exceptions Enabled | LogCriticalRemoteExceptionsEnabled | "Logging" tab |
|Log Remote Exceptions Enabled | LogRemoteExceptionsEnabled | "Logging" tab |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Tuning" tab => "Advanced" collapsible |
|MTU Size | MTUSize | "Tuning" tab => "Advanced" collapsible |
|Machine | Machine | "General" tab |
|Managed Server Independence Enabled | ManagedServerIndependenceEnabled | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Max Concurrent Long Running Requests | MaxConcurrentLongRunningRequests | "Tuning" tab => "Advanced" collapsible |
|Max Concurrent New Threads | MaxConcurrentNewThreads | "Tuning" tab => "Advanced" collapsible |
|Max Message Size | MaxMessageSize | "Protocols" tab |
|Max Open Sock Count | MaxOpenSockCount | "Tuning" tab => "Advanced" collapsible |
|Message ID Prefix Enabled | MessageIdPrefixEnabled | "Logging" tab |
|Muxer Class | MuxerClass | "Tuning" tab |
|Node Manager Socket Create Timeout In Milliseconds | NMSocketCreateTimeoutInMillis | "Tuning" tab |
|Native I/O Enabled | NativeIOEnabled | "Tuning" tab |
|Notes | Notes | "General" tab |
|Number Of Retries Before Managed Server Independence Mode | NumOfRetriesBeforeMsiMode | "Lifecycle" tab => "Health" tab |
|Outbound Enabled | OutboundEnabled | "General" tab => "Advanced" collapsible |
|Outbound Private Key Enabled | OutboundPrivateKeyEnabled | "General" tab => "Advanced" collapsible |
|Period Length | PeriodLength | "Tuning" tab => "Advanced" collapsible |
|Preferred Secondary Group | PreferredSecondaryGroup | "Cluster" tab |
|Print Stack Trace In Production | PrintStackTraceInProduction | "Logging" tab |
|Reliable Delivery Policy | ReliableDeliveryPolicy | "Application" tab |
|Replication Group | ReplicationGroup | "Cluster" tab |
|Replication Ports | ReplicationPorts | "Cluster" tab |
|Resolve DNS Name | ResolveDNSName | "Tuning" tab |
|Restart Delay Seconds | RestartDelaySeconds | "Lifecycle" tab => "Health" tab |
|Restart Interval Seconds | RestartIntervalSeconds | "Lifecycle" tab => "Health" tab |
|Restart Max | RestartMax | "Lifecycle" tab => "Health" tab |
|Retry Interval Before Managed Server Independence Mode | RetryIntervalBeforeMsiMode | "Lifecycle" tab => "Health" tab |
|Reverse DNS Allowed | ReverseDNSAllowed | "Tuning" tab |
|RMI Deserialization Max Time Limit | RmiDeserializationMaxTimeLimit | "Application" tab => "Advanced" collapsible |
|Scattered Reads Enabled | ScatteredReadsEnabled | "Tuning" tab => "Advanced" collapsible |
|Self Tuning Thread Pool Size Max | SelfTuningThreadPoolSizeMax | "Tuning" tab |
|Self Tuning Thread Pool Size Min | SelfTuningThreadPoolSizeMin | "Tuning" tab |
|Server Life Cycle Timeout Value | ServerLifeCycleTimeoutVal | "Lifecycle" tab => "General" tab |
|Session Replication On Shutdown Enabled | SessionReplicationOnShutdownEnabled | "Cluster" tab |
|Situational Config Polling Interval | SitConfigPollingInterval | "General" tab => "Advanced" collapsible |
|Situational Config Required | SitConfigRequired | "General" tab => "Advanced" collapsible |
|Socket Buffer Size As Chunk Size | SocketBufferSizeAsChunkSize | "Tuning" tab => "Advanced" collapsible |
|Socket Readers | SocketReaders | "Tuning" tab |
|Staging Directory Name | StagingDirectoryName | "Application" tab |
|Staging Mode | StagingMode | "Application" tab |
|Startup Mode | StartupMode | "Lifecycle" tab => "General" tab |
|Startup Timeout | StartupTimeout | "Lifecycle" tab => "General" tab |
|Stuck Thread Timer Interval | StuckThreadTimerInterval | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|Synchronized Session Timeout Enabled | SynchronizedSessionTimeoutEnabled | "Lifecycle" tab => "General" tab => "Advanced" collapsible |
|System Password | SystemPasswordEncrypted | "General" tab => "Advanced" collapsible |
|TGIOP Enabled | TGIOPEnabled | "Protocols" tab => "Advanced" collapsible |
|Thread Pool Percent Socket Readers | ThreadPoolPercentSocketReaders | "Tuning" tab |
|Transaction Log File Prefix | TransactionLogFilePrefix | "Transactions" tab |
|Transaction Log File Write Policy | TransactionLogFileWritePolicy | "Transactions" tab |
|Transaction Primary Channel Name | TransactionPrimaryChannelName | "Transactions" tab |
|Transaction Public Channel Name | TransactionPublicChannelName | "Transactions" tab |
|Transaction Public Secure Channel Name | TransactionPublicSecureChannelName | "Transactions" tab |
|Transaction Secure Channel Name | TransactionSecureChannelName | "Transactions" tab |
|Tunneling Client Ping Seconds | TunnelingClientPingSecs | "Protocols" tab |
|Tunneling Client Timeout Seconds | TunnelingClientTimeoutSecs | "Protocols" tab |
|Tunneling Enabled | TunnelingEnabled | "Protocols" tab |
|Upload Directory Name | UploadDirectoryName | "Application" tab |
|Use 8.1-Style Execute Queues | Use81StyleExecuteQueues | "Tuning" tab |
|Use Concurrent Queue For Request Manager | UseConcurrentQueueForRequestManager | "Tuning" tab |
|Use Detailed Thread Name | UseDetailedThreadName | "Diagnostics" tab |
|Use Enhanced Increment Advisor | UseEnhancedIncrementAdvisor | "Tuning" tab |
|Use Enhanced Priority Queue For Request Manager | UseEnhancedPriorityQueueForRequestManager | "Tuning" tab |
|Use Fusion For Last Logging Resource | UseFusionForLLR | "Transactions" tab |
|WebLogic Plug-in Enabled | WeblogicPluginEnabled | "General" tab |
|XML Entity Cache | XMLEntityCache | "Application" tab |
|XML Registry | XMLRegistry | "Application" tab |

### ServerTemplate / COM
Navigate to: Topology => Server Templates => (instance) => COM

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Apartment Threaded | ApartmentThreaded |  |
|Memory Logging Enabled | MemoryLoggingEnabled |  |
|NT Authentication Host | NTAuthHost |  |
|Native Mode Enabled | NativeModeEnabled |  |
|Notes | Notes |  |
|Prefetch Enums | PrefetchEnums |  |
|Verbose Logging Enabled | VerboseLoggingEnabled |  |

### ServerTemplate / CoherenceMemberConfig
Navigate to: Topology => Server Templates => (instance) => Coherence Member Config

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Coherence Web Federated Storage Enabled | CoherenceWebFederatedStorageEnabled | "Advanced" collapsible |
|Coherence Web Local Storage Enabled | CoherenceWebLocalStorageEnabled | "Advanced" collapsible |
|Local Storage Enabled | LocalStorageEnabled | "Advanced" collapsible |
|Notes | Notes |  |
|Rack Name | RackName |  |
|Role Name | RoleName |  |
|Site Name | SiteName |  |
|Unicast Listen Address | UnicastListenAddress |  |
|Unicast Listen Port | UnicastListenPort |  |
|Unicast Port Auto Adjust Attempts | UnicastPortAutoAdjustAttempts | "Advanced" collapsible |

### ServerTemplate / ConfigurationProperty
Navigate to: Topology => Server Templates => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### ServerTemplate / DataSource
Navigate to: Topology => Server Templates => (instance) => Data Source

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Datasource | DefaultDatasource |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|RMI JDBC Security | RmiJDBCSecurity |  |
|Targets | Target |  |

### ServerTemplate / DataSource / DataSourceLogFile
Navigate to: Topology => Server Templates => (instance) => Data Source => Data Source Log File

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor | "Advanced" collapsible |
|Log File Rotation Directory | LogFileRotationDir |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### ServerTemplate / DefaultFileStore
Navigate to: Topology => Server Templates => (instance) => Default File Store

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Block Size | BlockSize | "Advanced" collapsible |
|Cache Directory | CacheDirectory |  |
|Directory | Directory |  |
|File Locking Enabled | FileLockingEnabled | "Advanced" collapsible |
|Initial Size | InitialSize | "Advanced" collapsible |
|I/O Buffer Size | IoBufferSize | "Advanced" collapsible |
|Max File Size | MaxFileSize | "Advanced" collapsible |
|Max Window Buffer Size | MaxWindowBufferSize | "Advanced" collapsible |
|Min Window Buffer Size | MinWindowBufferSize | "Advanced" collapsible |
|Notes | Notes |  |
|Synchronous Write Policy | SynchronousWritePolicy |  |

### ServerTemplate / ExecuteQueue
Navigate to: Topology => Server Templates => (instance) => Execute Queues => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Queue Length | QueueLength |  |
|Queue Length Threshold Percent | QueueLengthThresholdPercent |  |
|Thread Count | ThreadCount |  |
|Threads Increase | ThreadsIncrease |  |
|Threads Maximum | ThreadsMaximum |  |
|Threads Minimum | ThreadsMinimum |  |
|Thread Priority | ThreadPriority | "Advanced" collapsible |

### ServerTemplate / HealthScore
Navigate to: Topology => Server Templates => (instance) => Health Score

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Calculate Interval Seconds | CalculateIntervalSecs |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Plug-in Class Name | PluginClassName |  |

### ServerTemplate / IIOP
Navigate to: Topology => Server Templates => (instance) => IIOP

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Character Codeset | DefaultCharCodeset |  |
|Default Minor Version | DefaultMinorVersion |  |
|Default Wide Character Codeset | DefaultWideCharCodeset |  |
|Enable IOR Servlet | EnableIORServlet | "Advanced" collapsible |
|Notes | Notes |  |
|System Security | SystemSecurity |  |
|Tx Mechanism | TxMechanism |  |
|Use Full Repository ID List | UseFullRepositoryIdList |  |
|Use Java Serialization | UseJavaSerialization | "Advanced" collapsible |
|Use Locate Request | UseLocateRequest | "Advanced" collapsible |
|Use Serial Format Version 2 | UseSerialFormatVersion2 |  |
|Use Stateful Authentication | UseStatefulAuthentication |  |

### ServerTemplate / JTAMigratableTarget
Navigate to: Topology => Server Templates => (instance) => JTA Migratable Target

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Additional Migration Attempts | AdditionalMigrationAttempts |  |
|Cluster | Cluster |  |
|Constrained Candidate Servers | ConstrainedCandidateServer |  |
|Critical | Critical |  |
|Migration Policy | MigrationPolicy |  |
|Milliseconds To Sleep Between Attempts | MillisToSleepBetweenAttempts |  |
|Non-Local Post-Deactivation Script Allowed | NonLocalPostAllowed |  |
|Notes | Notes |  |
|Number Of Restart Attempts | NumberOfRestartAttempts |  |
|Post-Deactivation Script | PostScript |  |
|Post-Deactivation Script Failure is Fatal | PostScriptFailureFatal |  |
|Pre-Migration Script | PreScript |  |
|Restart On Failure | RestartOnFailure |  |
|Seconds Between Restarts | SecondsBetweenRestarts |  |
|Strict Ownership Check | StrictOwnershipCheck |  |
|User Preferred Server | UserPreferredServer |  |

### ServerTemplate / Log
Navigate to: Topology => Server Templates => (instance) => Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|Domain Log Broadcast Filter | DomainLogBroadcastFilter | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcast Severity | DomainLogBroadcastSeverity | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|Domain Log Broadcaster Buffer Size | DomainLogBroadcasterBufferSize | "Advanced" collapsible => "Domain Log Broadcaster Settings" section |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Filter | LogFileFilter | "Advanced" collapsible |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log File Severity | LogFileSeverity | "Advanced" collapsible |
|Log Monitoring Enabled | LogMonitoringEnabled | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Interval Seconds | LogMonitoringIntervalSecs | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Max Throttle Message Signature Count | LogMonitoringMaxThrottleMessageSignatureCount | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Message Length | LogMonitoringThrottleMessageLength | "Advanced" collapsible => "Log Monitoring Settings" section |
|Log Monitoring Throttle Threshold | LogMonitoringThrottleThreshold | "Advanced" collapsible => "Log Monitoring Settings" section |
|Logger Severity | LoggerSeverity | "Advanced" collapsible |
|Logger Severity Properties | LoggerSeverityProperties | "Advanced" collapsible |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Platform Logger Levels | PlatformLoggerLevels | "Advanced" collapsible |
|Redirect Stderr To Server Log Enabled | RedirectStderrToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Redirect Stdout To Server Log Enabled | RedirectStdoutToServerLogEnabled | "Advanced" collapsible => "Standard Out Log Settings" section |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |
|Stacktrace Depth | StacktraceDepth | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Filter | StdoutFilter | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Format | StdoutFormat | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Log Stack | StdoutLogStack | "Advanced" collapsible => "Standard Out Log Settings" section |
|Stdout Severity | StdoutSeverity | "Advanced" collapsible => "Standard Out Log Settings" section |
|Trigger Truncation Stack Frame Depth After Trigger | TriggerTruncationStackFrameDepthAfterTrigger | "Advanced" collapsible => "Miscellaneous" section |
|Trigger Truncation Stack Frame Trigger Depth | TriggerTruncationStackFrameTriggerDepth | "Advanced" collapsible => "Miscellaneous" section |

### ServerTemplate / NetworkAccessPoint
Navigate to: Topology => Server Templates => (instance) => Network Access Points => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Backlog | AcceptBacklog | "Tuning Parameters" tab |
|Allow List Violation Action | AllowListViolationAction | "Security" tab => "Advanced" collapsible |
|Allow Unencrypted Null Cipher | AllowUnencryptedNullCipher | "Security" tab => "Advanced" collapsible |
|Channel Identity Customized | ChannelIdentityCustomized | "Security" tab => "Advanced" collapsible |
|Channel Weight | ChannelWeight | "Tuning Parameters" tab |
|Cipher Suites | Ciphersuite | "Security" tab => "Advanced" collapsible |
|Client Certificate Enforced | ClientCertificateEnforced | "Security" tab |
|Client-Initiated Secure Renegotiation Accepted | ClientInitSecureRenegotiationAccepted | "Security" tab => "Advanced" collapsible |
|Cluster Address | ClusterAddress | "General" tab => "Advanced" collapsible |
|Complete Message Timeout | CompleteMessageTimeout | "Protocols" tab |
|Connect Timeout | ConnectTimeout | "Protocols" tab |
|Custom Identity Keystore File Name | CustomIdentityKeyStoreFileName | "Security" tab => "Keystore Configuration" section |
|Custom Identity Keystore Passphrase | CustomIdentityKeyStorePassPhraseEncrypted | "Security" tab => "Keystore Configuration" section |
|Custom Identity Keystore Type | CustomIdentityKeyStoreType | "Security" tab => "Keystore Configuration" section |
|Custom Private Key Alias | CustomPrivateKeyAlias | "Security" tab => "Keystore Configuration" section |
|Custom Private Key Passphrase | CustomPrivateKeyPassPhraseEncrypted | "Security" tab => "Keystore Configuration" section |
|Domain Keystores Client Certificate Alias | DomainKeystoresClientCertAlias | "Security" tab => "Keystore Configuration" section |
|Domain Keystores Server Certificate Alias | DomainKeystoresServerCertAlias | "Security" tab => "Keystore Configuration" section |
|Enabled | Enabled | "General" tab |
|Excluded Cipher Suites | ExcludedCiphersuite | "Security" tab => "Advanced" collapsible |
|External DNS Name | ExternalDNSName | "General" tab => "Advanced" collapsible |
|Hostname Verification Ignored | HostnameVerificationIgnored | "Security" tab |
|Hostname Verifier | HostnameVerifier | "Security" tab |
|HTTP Enabled For This Protocol | HttpEnabledForThisProtocol | "Protocols" tab |
|Idle Connection Timeout | IdleConnectionTimeout | "Protocols" tab |
|Inbound Certificate Validation | InboundCertificateValidation | "Security" tab |
|Listen Address | ListenAddress | "General" tab |
|Listen Port | ListenPort | "General" tab |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Tuning Parameters" tab |
|Login Timeout Millis SSL | LoginTimeoutMillisSSL | "Tuning Parameters" tab |
|Max Backoff Between Failures | MaxBackoffBetweenFailures | "Tuning Parameters" tab |
|Max Connected Clients | MaxConnectedClients | "Tuning Parameters" tab |
|Max Message Size | MaxMessageSize | "Protocols" tab |
|Minimum TLS Protocol Version | MinimumTlsProtocolVersion | "Security" tab |
|Notes | Notes | "General" tab |
|Outbound Certificate Validation | OutboundCertificateValidation | "Security" tab |
|Outbound Enabled | OutboundEnabled | "General" tab => "Advanced" collapsible |
|Outbound Private Key Enabled | OutboundPrivateKeyEnabled | "Security" tab => "Keystore Configuration" section |
|Protocol | Protocol | "General" tab |
|Proxy Address | ProxyAddress | "General" tab => "Advanced" collapsible |
|Proxy Port | ProxyPort | "General" tab => "Advanced" collapsible |
|Public Address | PublicAddress | "General" tab |
|Public Port | PublicPort | "General" tab |
|Resolve DNS Name | ResolveDNSName | "Tuning Parameters" tab |
|Socket Direct Protocol (SDP) Enabled | SdpEnabled | "Protocols" tab |
|Server Cipher Suites Order Enabled | ServerCipherSuitesOrderEnabled | "Security" tab => "Advanced" collapsible |
|SSL v2 Hello Enabled | SsLv2HelloEnabled | "Security" tab => "Advanced" collapsible |
|Timeout Connection With Pending Responses | TimeoutConnectionWithPendingResponses | "Tuning Parameters" tab |
|Tunneling Client Ping Seconds | TunnelingClientPingSecs | "Protocols" tab |
|Tunneling Client Timeout Seconds | TunnelingClientTimeoutSecs | "Protocols" tab |
|Tunneling Enabled | TunnelingEnabled | "Protocols" tab |
|Two-Way SSL Enabled | TwoWaySSLEnabled | "Security" tab |
|Use Fast Serialization | UseFastSerialization | "Tuning Parameters" tab |

### ServerTemplate / OverloadProtection
Navigate to: Topology => Server Templates => (instance) => Overload Protection

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Failure Action | FailureAction |  |
|Free Memory Percent High Threshold | FreeMemoryPercentHighThreshold |  |
|Free Memory Percent Low Threshold | FreeMemoryPercentLowThreshold |  |
|Notes | Notes |  |
|Panic Action | PanicAction |  |
|Shared Capacity For Work Managers | SharedCapacityForWorkManagers |  |

### ServerTemplate / OverloadProtection / ServerFailureTrigger
Navigate to: Topology => Server Templates => (instance) => Overload Protection => Server Failure Trigger

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Heap Dump On Deadlock | HeapDumpingOnDeadlock |  |
|Heap Dump On Max Stuck Threads | HeapDumpingOnMaxStuckThread |  |
|Max Stuck Thread Time | MaxStuckThreadTime |  |
|Stuck Thread Count | StuckThreadCount |  |
|Notes | Notes |  |
|Verbose Stuck Thread Name | VerboseStuckThreadName |  |

### ServerTemplate / RmiForwarding
Navigate to: Topology => Server Templates => (instance) => RMI Forwarding => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|URL | Url |  |

### ServerTemplate / RmiForwarding / ConfigurationProperty
Navigate to: Topology => Server Templates => (instance) => RMI Forwarding => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### ServerTemplate / SSL
Navigate to: Topology => Server Templates => (instance) => SSL

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept KSS Demo Certs Enabled | AcceptKssDemoCertsEnabled |  |
|Allow Unencrypted Null Cipher | AllowUnencryptedNullCipher | "Advanced" collapsible |
|Cipher Suites | Ciphersuite | "Advanced" collapsible |
|Client Certificate Alias | ClientCertAlias | "Advanced" collapsible |
|Client Certificate Private Key Passphrase | ClientCertPrivateKeyPassPhraseEncrypted | "Advanced" collapsible |
|Client Certificate Enforced | ClientCertificateEnforced | "Advanced" collapsible |
|Client-Initiated Secure Renegotiation Accepted | ClientInitSecureRenegotiationAccepted | "Advanced" collapsible |
|Domain Keystores Client Certificate Alias | DomainKeystoresClientCertAlias |  |
|Domain Keystores Server Certificate Alias | DomainKeystoresServerCertAlias |  |
|SSL Enabled | Enabled |  |
|Excluded Cipher Suites | ExcludedCiphersuite | "Advanced" collapsible |
|Export Key Lifespan | ExportKeyLifespan | "Advanced" collapsible |
|Hostname Verification Ignored | HostnameVerificationIgnored | "Advanced" collapsible |
|Hostname Verifier | HostnameVerifier | "Advanced" collapsible |
|Identity And Trust Locations | IdentityAndTrustLocations |  |
|Inbound Certificate Validation | InboundCertificateValidation | "Advanced" collapsible |
|JSSE Enabled | JSSEEnabled |  |
|SSL Listen Port | ListenPort |  |
|Login Timeout Milliseconds | LoginTimeoutMillis | "Advanced" collapsible |
|Minimum TLS Protocol Version | MinimumTlsProtocolVersion |  |
|Notes | Notes |  |
|Outbound Certificate Validation | OutboundCertificateValidation | "Advanced" collapsible |
|Outbound Private Key Passphrase | OutboundPrivateKeyPassPhraseEncrypted | "Advanced" collapsible |
|SSL Rejection Logging Enabled | SSLRejectionLoggingEnabled | "Advanced" collapsible |
|Server Cipher Suites Order Enabled | ServerCipherSuitesOrderEnabled | "Advanced" collapsible |
|Server Private Key Alias | ServerPrivateKeyAlias |  |
|Server Private Key Passphrase | ServerPrivateKeyPassPhraseEncrypted |  |
|SSL v2 Hello Enabled | SsLv2HelloEnabled | "Advanced" collapsible |
|Two-Way SSL Enabled | TwoWaySSLEnabled | "Advanced" collapsible |
|Use Client Cert For Outbound | UseClientCertForOutbound | "Advanced" collapsible |
|Use Server Certificates | UseServerCerts | "Advanced" collapsible |

### ServerTemplate / ServerDebug
Navigate to: Topology => Server Templates => (instance) => Server Debug

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Application Container | ApplicationContainer | "Application" tab |
|Class Change Notifier | ClassChangeNotifier | "Application" tab |
|Class Finder | ClassFinder | "Application" tab |
|Class Loader | ClassLoader | "Application" tab |
|Class Loader Verbose | ClassLoaderVerbose | "Application" tab |
|Classloader Web App | ClassloaderWebApp | "Application" tab |
|Classpath Servlet | ClasspathServlet | "Containers" tab |
|Debug Abbreviation | DebugAbbreviation | "Core" tab |
|Debug Abbrevs | DebugAbbrevs | "Core" tab |
|Debug Allow List | DebugAllowList | "Security" tab |
|Debug Application Annotations | DebugAppAnnotations | "Application" tab |
|Debug Application Annotation Lookup | DebugAppAnnoLookup | "Application" tab |
|Debug Application Annotation Query | DebugAppAnnoQuery | "Application" tab |
|Debug Application Annotation Query Verbose | DebugAppAnnoQueryVerbose | "Application" tab |
|Debug Application Annotation Scan Data | DebugAppAnnoScanData | "Application" tab |
|Debug Application Annotation Scan Verbose | DebugAppAnnoScanVerbose | "Application" tab |
|Debug Application Annotation Verbose Lookup | DebugAppAnnoVerboseLookup | "Application" tab |
|Debug Application Client | DebugAppClient | "Application" tab |
|Debug Application Container | DebugAppContainer | "Application" tab |
|Debug Application Container Tools | DebugAppContainerTools | "Application" tab |
|Debug Application Metadata Cache | DebugAppMetadataCache | "Application" tab |
|Debug Application Timing | DebugAppTiming | "Application" tab |
|Debug Async Queue | DebugAsyncQueue | "Core" tab |
|Debug Attach | DebugAttach | "Core" tab |
|Debug Background Deployment | DebugBackgroundDeployment | "Application" tab |
|Debug Batch Connector | DebugBatchConnector | "Containers" tab |
|Debug Bean Tree Harvester Control | DebugBeanTreeHarvesterControl | "Diagnostics" tab |
|Debug Bean Tree Harvester Data Collection | DebugBeanTreeHarvesterDataCollection | "Diagnostics" tab |
|Debug Bean Tree Harvester Resolution | DebugBeanTreeHarvesterResolution | "Diagnostics" tab |
|Debug Bean Tree Harvester Threading | DebugBeanTreeHarvesterThreading | "Diagnostics" tab |
|Debug Bootstrap Servlet | DebugBootstrapServlet | "Containers" tab |
|Debug Buzz Protocol | DebugBuzzProtocol | "Miscellaneous" tab |
|Debug Buzz Protocol Details | DebugBuzzProtocolDetails | "Miscellaneous" tab |
|Debug Buzz Protocol HTTP | DebugBuzzProtocolHttp | "Miscellaneous" tab |
|Debug Cat | DebugCat | "Miscellaneous" tab |
|Debug Certificate Check | DebugCertificateCheck | "Security" tab |
|Debug Cert Revoc Check | DebugCertRevocCheck | "Security" tab |
|Debug Channel | DebugChannel | "Network" tab |
|Debug Channel Map | DebugChannelMap | "Network" tab |
|Debug Class Loading Archive Checker | DebugClassLoadingArchiveChecker | "Application" tab |
|Debug Class Loading Consistency Checker | DebugClassLoadingConsistencyChecker | "Application" tab |
|Debug Class Loading Contextual Trace | DebugClassLoadingContextualTrace | "Application" tab |
|Debug Class Loading Verbose | DebugClassLoadingVerbose | "Application" tab |
|Debug Class Redefinition | DebugClassRedef | "Application" tab |
|Debug Class Size | DebugClassSize | "Application" tab |
|Debug Cluster | DebugCluster | "Core" tab |
|Debug Cluster Announcements | DebugClusterAnnouncements | "Core" tab |
|Debug Cluster Fragments | DebugClusterFragments | "Core" tab |
|Debug Cluster Heartbeats | DebugClusterHeartbeats | "Core" tab |
|Debug Cluster Verbose | DebugClusterVerbose | "Core" tab |
|Debug Coherence | DebugCoherence | "Core" tab |
|Debug Concurrent | DebugConcurrent | "Core" tab |
|Debug Concurrent Context | DebugConcurrentContext | "Core" tab |
|Debug Concurrent Managed Executor Services | DebugConcurrentMes | "Core" tab |
|Debug Concurrent Managed Scheduled Executor Services | DebugConcurrentMses | "Core" tab |
|Debug Concurrent Managed Thread Factories | DebugConcurrentMtf | "Core" tab |
|Debug Concurrent Transaction | DebugConcurrentTransaction | "Core" tab |
|Debug Configuration Edit | DebugConfigurationEdit | "Management" tab |
|Debug Configuration Runtime | DebugConfigurationRuntime | "Management" tab |
|Debug Connection | DebugConnection | "Core" tab |
|Debug Connector Service | DebugConnectorService | "Containers" tab |
|Debug Consensus Leasing | DebugConsensusLeasing | "Core" tab |
|Debug Coherence Web Global Reaper | DebugCWebGlobalReaper | "Core" tab |
|Debug Deserialization Time Limit | DebugDeserializationTimeLimit | "Security" tab |
|Debug Distributed GC Enrollment | DebugDGCEnrollment | "Core" tab |
|Debug Dynamic Load Balancing (DLB) | DebugDlb | "Messaging" tab |
|Debug Dynamic Load Balancing (DLB) Fine | DebugDlbFine | "Messaging" tab |
|Debug Dynamic Load Balancing (DLB) Finest | DebugDlbFinest | "Messaging" tab |
|Debug Data Replication Service Calls | DebugDRSCalls | "Core" tab |
|Debug Data Replication Service Heartbeats | DebugDRSHeartbeats | "Core" tab |
|Debug Data Replication Service Messages | DebugDRSMessages | "Core" tab |
|Debug Data Replication Service Queues | DebugDRSQueues | "Core" tab |
|Debug Data Replication Service State Transitions | DebugDRSStateTransitions | "Core" tab |
|Debug Data Replication Service Update Status | DebugDRSUpdateStatus | "Core" tab |
|Debug Data Source Interceptor | DebugDataSourceInterceptor | "Persistence" tab |
|Debug Debug Patches | DebugDebugPatches | "Diagnostics" tab |
|Debug Default Store Verbose | DebugDefaultStoreVerbose | "Application" tab |
|Debug Deploy | DebugDeploy | "Application" tab |
|Debug Deployment | DebugDeployment | "Application" tab |
|Debug Deployment Concise | DebugDeploymentConcise | "Application" tab |
|Debug Deployment Plan | DebugDeploymentPlan | "Application" tab |
|Debug Deployment Service | DebugDeploymentService | "Application" tab |
|Debug Deployment Service Internal | DebugDeploymentServiceInternal | "Application" tab |
|Debug Deployment Service Status Updates | DebugDeploymentServiceStatusUpdates | "Application" tab |
|Debug Deployment Service Transport | DebugDeploymentServiceTransport | "Application" tab |
|Debug Deployment Service Transport HTTP | DebugDeploymentServiceTransportHttp | "Application" tab |
|Debug Descriptor | DebugDescriptor | "Application" tab |
|Debug Diagnostic Accessor | DebugDiagnosticAccessor | "Diagnostics" tab |
|Debug Diagnostic Action Wrapper | DebugDiagnosticActionWrapper | "Diagnostics" tab |
|Debug Diagnostic Archive | DebugDiagnosticArchive | "Diagnostics" tab |
|Debug Diagnostic Archive Retirement | DebugDiagnosticArchiveRetirement | "Diagnostics" tab |
|Debug Diagnostic Collections | DebugDiagnosticCollections | "Diagnostics" tab |
|Debug Diagnostic Context | DebugDiagnosticContext | "Diagnostics" tab |
|Debug Diagnostic Data Gathering | DebugDiagnosticDataGathering | "Diagnostics" tab |
|Debug Diagnostic File Archive | DebugDiagnosticFileArchive | "Diagnostics" tab |
|Debug Diagnostic Image | DebugDiagnosticImage | "Diagnostics" tab |
|Debug Diagnostic Instrumentation | DebugDiagnosticInstrumentation | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Actions | DebugDiagnosticInstrumentationActions | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Class Info | DebugDiagnosticInstrumentationClassInfo | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Config | DebugDiagnosticInstrumentationConfig | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Events | DebugDiagnosticInstrumentationEvents | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Result | DebugDiagnosticInstrumentationResult | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Weaving | DebugDiagnosticInstrumentationWeaving | "Diagnostics" tab |
|Debug Diagnostic Instrumentation Weaving Matches | DebugDiagnosticInstrumentationWeavingMatches | "Diagnostics" tab |
|Debug Diagnostic JDBC Archive | DebugDiagnosticJdbcArchive | "Diagnostics" tab |
|Debug Diagnostic Lifecycle Handlers | DebugDiagnosticLifecycleHandlers | "Diagnostics" tab |
|Debug Diagnostic Notifications | DebugDiagnosticNotifications | "Diagnostics" tab |
|Debug Diagnostic Query | DebugDiagnosticQuery | "Diagnostics" tab |
|Debug Diagnostic Runtime Control Driver | DebugDiagnosticRuntimeControlDriver | "Diagnostics" tab |
|Debug Diagnostic Runtime Control Service | DebugDiagnosticRuntimeControlService | "Diagnostics" tab |
|Debug Diagnostic Watch | DebugDiagnosticWatch | "Diagnostics" tab |
|Debug Diagnostic Watch Events | DebugDiagnosticWatchEvents | "Diagnostics" tab |
|Debug Diagnostic Watch Events Details | DebugDiagnosticWatchEventsDetails | "Diagnostics" tab |
|Debug Diagnostic Watch Utils | DebugDiagnosticWatchUtils | "Diagnostics" tab |
|Debug Diagnostic WebLogic Store Archive | DebugDiagnosticWlstoreArchive | "Diagnostics" tab |
|Debug Diagnostics Bean Extension Resolver | DebugDiagnosticsBeanExtensionResolver | "Diagnostics" tab |
|Debug Diagnostics Bean Info Providers | DebugDiagnosticsBeanInfoProviders | "Diagnostics" tab |
|Debug Diagnostics Expression Language Context | DebugDiagnosticsElContext | "Diagnostics" tab |
|Debug Diagnostics Expression Language Resolver | DebugDiagnosticsElResolver | "Diagnostics" tab |
|Debug Diagnostics Expression Evaluators | DebugDiagnosticsExpressionEvaluators | "Diagnostics" tab |
|Debug Diagnostics Expression Function Mapper | DebugDiagnosticsExpressionFunctionMapper | "Diagnostics" tab |
|Debug Diagnostics Expression Functions | DebugDiagnosticsExpressionFunctions | "Diagnostics" tab |
|Debug Diagnostics Expression Metrics | DebugDiagnosticsExpressionMetrics | "Diagnostics" tab |
|Debug Diagnostics Expression Poller | DebugDiagnosticsExpressionPoller | "Diagnostics" tab |
|Debug Diagnostics Expression Poller Buffer | DebugDiagnosticsExpressionPollerBuffer | "Diagnostics" tab |
|Debug Diagnostics Harvester | DebugDiagnosticsHarvester | "Diagnostics" tab |
|Debug Diagnostics Harvester Data | DebugDiagnosticsHarvesterData | "Diagnostics" tab |
|Debug Diagnostics Harvester MBean Plug-in | DebugDiagnosticsHarvesterMBeanPlugin | "Diagnostics" tab |
|Debug Diagnostics Harvester Tree Bean Plug-in | DebugDiagnosticsHarvesterTreeBeanPlugin | "Diagnostics" tab |
|Debug Diagnostics MBean Expression Language Resolver | DebugDiagnosticsMBeanElResolver | "Diagnostics" tab |
|Debug Diagnostics Module | DebugDiagnosticsModule | "Diagnostics" tab |
|Debug Diagnostics Notifications | DebugDiagnosticsNotifications | "Diagnostics" tab |
|Debug Diagnostics Script Action | DebugDiagnosticsScriptAction | "Diagnostics" tab |
|Debug Diagnostics Timer | DebugDiagnosticsTimer | "Diagnostics" tab |
|Debug Diagnostics Timer Service | DebugDiagnosticsTimerService | "Diagnostics" tab |
|Debug Diagnostics Utilities | DebugDiagnosticsUtils | "Diagnostics" tab |
|Debug Diagnostics Value Tracing Expression Language Resolver | DebugDiagnosticsValueTracingElResolver | "Diagnostics" tab |
|Debug Domain Log Handler | DebugDomainLogHandler | "Diagnostics" tab |
|Debug Domain Upgrade Server Service | DebugDomainUpgradeServerService | "Core" tab |
|Debug Dynamic Singleton Services | DebugDynamicSingletonServices | "Core" tab |
|Debug EJB Caching | DebugEjbCaching | "Containers" tab |
|Debug EJB Container-Managed Persistence Deployment | DebugEjbCmpDeployment | "Containers" tab |
|Debug EJB Container-Managed Persistence Runtime | DebugEjbCmpRuntime | "Containers" tab |
|Debug EJB Compilation | DebugEjbCompilation | "Containers" tab |
|Debug EJB Deployment | DebugEjbDeployment | "Containers" tab |
|Debug EJB Invoke | DebugEjbInvoke | "Containers" tab |
|Debug EJB Locking | DebugEjbLocking | "Containers" tab |
|Debug EJB MDB AQ Message Recovery | DebugEjbMdbAqMessageRecovery | "Containers" tab |
|Debug EJB MDB Connection | DebugEjbMdbConnection | "Containers" tab |
|Debug EJB MDB Listener | DebugEjbMdbListener | "Containers" tab |
|Debug EJB Metadata | DebugEjbMetadata | "Containers" tab |
|Debug EJB Pooling | DebugEjbPooling | "Containers" tab |
|Debug EJB Security | DebugEjbSecurity | "Containers" tab |
|Debug EJB Swapping | DebugEjbSwapping | "Containers" tab |
|Debug EJB Swapping Verbose | DebugEjbSwappingVerbose | "Containers" tab |
|Debug EJB Timer Store | DebugEjbTimerStore | "Containers" tab |
|Debug EJB Timers | DebugEjbTimers | "Containers" tab |
|Debug Elastic Actions | DebugElasticActions | "Diagnostics" tab |
|Debug Elastic Services | DebugElasticServices | "Diagnostics" tab |
|Debug Embedded LDAP | DebugEmbeddedLDAP | "Security" tab |
|Debug Embedded LDAP Log Level | DebugEmbeddedLDAPLogLevel | "Security" tab |
|Debug Embedded LDAP Log To Console | DebugEmbeddedLDAPLogToConsole | "Security" tab |
|Debug Embedded LDAP Write Override Props | DebugEmbeddedLDAPWriteOverrideProps | "Security" tab |
|Debug Event Manager | DebugEventManager | "Miscellaneous" tab |
|Debug Expression Bean Localizer | DebugExpressionBeanLocalizer | "Diagnostics" tab |
|Debug Expression Extensions Manager | DebugExpressionExtensionsManager | "Diagnostics" tab |
|Debug Expression Poller | DebugExpressionPoller | "Diagnostics" tab |
|Debug Fail Over | DebugFailOver | "Core" tab |
|Debug Fail Over Verbose | DebugFailOverVerbose | "Core" tab |
|Debug Federated Configuration | DebugFederatedConfig | "Management" tab |
|Debug File Change Observer | DebugFileChangeObserver | "Management" tab |
|Debug File Distribution Servlet | DebugFileDistributionServlet | "Management" tab |
|Debug File Owner Fixer | DebugFileOwnerFixer | "Core" tab |
|Debug Generic Method Descriptor | DebugGenericMethodDescriptor | "Application" tab |
|Debug Harvester Type Info Cache | DebugHarvesterTypeInfoCache | "Diagnostics" tab |
|Debug Health | DebugHealth | "Core" tab |
|Debug Health Check | DebugHealthCheck | "Core" tab |
|Debug Health Score | DebugHealthScore | "Core" tab |
|Debug HK2 Statistics | DebugHk2Statistics | "Core" tab |
|Debug HTTP 2 Send Window Size | DebugHttp2SendWindowSize | "Containers" tab |
|Debug HTTP | DebugHttp | "Containers" tab |
|Debug HTTP Concise | DebugHttpConcise | "Containers" tab |
|Debug HTTP Logging | DebugHttpLogging | "Containers" tab |
|Debug HTTP Sessions | DebugHttpSessions | "Containers" tab |
|Debug HTTP Sessions Concise | DebugHttpSessionsConcise | "Containers" tab |
|Debug IIOP | DebugIIOP | "Network" tab |
|Debug IIOP Connection | DebugIIOPConnection | "Network" tab |
|Debug IIOP Marshal | DebugIIOPMarshal | "Network" tab |
|Debug IIOP Naming | DebugIIOPNaming | "Network" tab |
|Debug IIOPOTS | DebugIIOPOTS | "Network" tab |
|Debug IIOP Replacer | DebugIIOPReplacer | "Network" tab |
|Debug IIOP Security | DebugIIOPSecurity | "Network" tab |
|Debug IIOP Startup | DebugIIOPStartup | "Network" tab |
|Debug IIOP Transport | DebugIIOPTransport | "Network" tab |
|Debug IIOP Tunneling | DebugIIOPTunneling | "Network" tab |
|Debug IIOP Detail | DebugIiopDetail | "Network" tab |
|Debug Interceptors | DebugInterceptors | "Containers" tab |
|Debug J2EE Management | DebugJ2EEManagement | "Management" tab |
|Debug JAXP Debug Level | DebugJAXPDebugLevel | "Miscellaneous" tab |
|Debug JAXP Debug Name | DebugJAXPDebugName | "Miscellaneous" tab |
|Debug JAXP Include Class | DebugJAXPIncludeClass | "Miscellaneous" tab |
|Debug JAXP Include Location | DebugJAXPIncludeLocation | "Miscellaneous" tab |
|Debug JAXP Include Name | DebugJAXPIncludeName | "Miscellaneous" tab |
|Debug JAXP Include Time | DebugJAXPIncludeTime | "Miscellaneous" tab |
|Debug JAXP Use Short Class | DebugJAXPUseShortClass | "Miscellaneous" tab |
|Debug JDBC Connection | DebugJDBCConn | "Persistence" tab |
|Debug JDBC Driver Logging | DebugJDBCDriverLogging | "Persistence" tab |
|Debug JDBC Internal | DebugJDBCInternal | "Persistence" tab |
|Debug JDBC RMI | DebugJDBCRMI | "Persistence" tab |
|Debug JDBC SQL | DebugJDBCSQL | "Persistence" tab |
|Debug JMS Back End | DebugJMSBackEnd | "Messaging" tab |
|Debug JMS Boot | DebugJMSBoot | "Messaging" tab |
|Debug JMS Component Invocation Context Helper | DebugJmscicHelper | "Messaging" tab |
|Debug JMS Common | DebugJMSCommon | "Messaging" tab |
|Debug JMS Configuration | DebugJMSConfig | "Messaging" tab |
|Debug JMS Dispatcher | DebugJMSDispatcher | "Messaging" tab |
|Debug JMS Dispatcher Lifecycle | DebugJmsDispatcherLifecycle | "Messaging" tab |
|Debug JMS Dispatcher RMI | DebugJmsDispatcherRmi | "Messaging" tab |
|Debug JMS Dispatcher Wire | DebugJmsDispatcherWire | "Messaging" tab |
|Debug JMS Distributed Topic | DebugJMSDistTopic | "Messaging" tab |
|Debug JMS Front End | DebugJMSFrontEnd | "Messaging" tab |
|Debug JMS Invocable Verbose | DebugJmsInvocableVerbose | "Messaging" tab |
|Debug JMS JDBC Scavenge On Flush | DebugJMSJDBCScavengeOnFlush | "Messaging" tab |
|Debug JMS Locking | DebugJMSLocking | "Messaging" tab |
|Debug JMS Message Path | DebugJMSMessagePath | "Messaging" tab |
|Debug JMS Module | DebugJMSModule | "Messaging" tab |
|Debug JMS Pause Resume | DebugJMSPauseResume | "Messaging" tab |
|Debug JMS SAF | DebugJMSSAF | "Messaging" tab |
|Debug JMS Wrappers | DebugJMSWrappers | "Messaging" tab |
|Debug JMS XA | DebugJMSXA | "Messaging" tab |
|Debug JMX | DebugJMX | "Management" tab |
|Debug JMX Core | DebugJMXCore | "Management" tab |
|Debug JMX Domain | DebugJMXDomain | "Management" tab |
|Debug JMX Edit | DebugJMXEdit | "Management" tab |
|Debug JMX Runtime | DebugJMXRuntime | "Management" tab |
|Debug JNDI | DebugJNDI | "Core" tab |
|Debug JNDI Factories | DebugJNDIFactories | "Core" tab |
|Debug JNDI Resolution | DebugJNDIResolution | "Core" tab |
|Debug JTA 2PC | DebugJTA2PC | "Transactions" tab |
|Debug JTA 2PC Stack Trace | DebugJTA2PCStackTrace | "Transactions" tab |
|Debug JTA API | DebugJTAAPI | "Transactions" tab |
|Debug JTA Gateway | DebugJTAGateway | "Transactions" tab |
|Debug JTA Gateway Stack Trace | DebugJTAGatewayStackTrace | "Transactions" tab |
|Debug JTA Health | DebugJTAHealth | "Transactions" tab |
|Debug JTA JDBC | DebugJTAJDBC | "Transactions" tab |
|Debug JTA Last Logging Resource (LLR) | DebugJTALLR | "Transactions" tab |
|Debug JTA Lifecycle | DebugJTALifecycle | "Transactions" tab |
|Debug JTA Migration | DebugJTAMigration | "Transactions" tab |
|Debug JTA Naming | DebugJTANaming | "Transactions" tab |
|Debug JTA Naming Stack Trace | DebugJTANamingStackTrace | "Transactions" tab |
|Debug JTA Non XA | DebugJTANonXA | "Transactions" tab |
|Debug JTA Peer Site Recovery | DebugJtaPeerSiteRecovery | "Transactions" tab |
|Debug JTA Propagate | DebugJTAPropagate | "Transactions" tab |
|Debug JTA RMI | DebugJTARMI | "Transactions" tab |
|Debug JTA Recovery | DebugJTARecovery | "Transactions" tab |
|Debug JTA Recovery Stack Trace | DebugJTARecoveryStackTrace | "Transactions" tab |
|Debug JTA Resource Health | DebugJTAResourceHealth | "Transactions" tab |
|Debug JTA Resource Name | DebugJTAResourceName | "Transactions" tab |
|Debug JTA Transaction Log (TLOG) | DebugJTATLOG | "Transactions" tab |
|Debug JTA XA | DebugJTAXA | "Transactions" tab |
|Debug JTA XA Stack Trace | DebugJTAXAStackTrace | "Transactions" tab |
|Debug JVMID | DebugJvmid | "Core" tab |
|Debug JDBC Replay | DebugJdbcReplay | "Persistence" tab |
|Debug JDBC ONS | DebugJdbcons | "Persistence" tab |
|Debug JDBC RAC | DebugJdbcrac | "Persistence" tab |
|Debug JDBC Universal Connection Pool (UCP) | DebugJdbcucp | "Persistence" tab |
|Debug JMS Client | DebugJmsClient | "Messaging" tab |
|Debug JMS Client Stack Trace | DebugJmsClientStackTrace | "Messaging" tab |
|Debug JMS Cross Domain Security | DebugJmsCrossDomainSecurity | "Messaging" tab |
|Debug JMS Dispatcher Proxy | DebugJmsDispatcherProxy | "Messaging" tab |
|Debug JMS Dispatcher Utilities Verbose | DebugJmsDispatcherUtilsVerbose | "Messaging" tab |
|Debug JMS Dispatcher Verbose | DebugJmsDispatcherVerbose | "Messaging" tab |
|Debug JMS DotNet Proxy | DebugJmsDotNetProxy | "Messaging" tab |
|Debug JMS DotNet T3 Server | DebugJmsDotNetT3Server | "Messaging" tab |
|Debug JMS DotNet Transport | DebugJmsDotNetTransport | "Messaging" tab |
|Debug JMS Durable Subscribers (DurSub) | DebugJmsDurSub | "Messaging" tab |
|Debug JMS Store | DebugJmsStore | "Messaging" tab |
|Debug JMS Continuous Data Services (CDS) | DebugJmscds | "Messaging" tab |
|Debug JMS JNDI | DebugJmsjndi | "Messaging" tab |
|Debug JMS Observer | DebugJmsobs | "Messaging" tab |
|Debug JMS T3 Server | DebugJmst3Server | "Messaging" tab |
|Debug JMX Compatibility | DebugJmxCompatibility | "Management" tab |
|Debug JMX Context | DebugJmxContext | "Management" tab |
|Debug JMX Core Concise | DebugJmxCoreConcise | "Management" tab |
|Debug JPA | DebugJpa | "Persistence" tab |
|Debug JPA Data Cache | DebugJpaDataCache | "Persistence" tab |
|Debug JPA Enhance | DebugJpaEnhance | "Persistence" tab |
|Debug JPA JDBC JDBC | DebugJpaJdbcJdbc | "Persistence" tab |
|Debug JPA JDBC Schema | DebugJpaJdbcSchema | "Persistence" tab |
|Debug JPA JDBC SQL | DebugJpaJdbcSql | "Persistence" tab |
|Debug JPA Management/Monitoring | DebugJpaManage | "Persistence" tab |
|Debug JPA Metadata | DebugJpaMetaData | "Persistence" tab |
|Debug JPA Profile | DebugJpaProfile | "Persistence" tab |
|Debug JPA Query | DebugJpaQuery | "Persistence" tab |
|Debug JPA Runtime | DebugJpaRuntime | "Persistence" tab |
|Debug JPA Tool | DebugJpaTool | "Persistence" tab |
|Debug JTA 2 PC Detail | DebugJta2PcDetail | "Transactions" tab |
|Debug JTA Contexts and Dependency Injection (CDI), | DebugJtacdi | "Transactions" tab |
|Debug Kernel | DebugKernel | "Core" tab |
|Debug Kodo WebLogic | DebugKodoWeblogic | "Persistence" tab |
|Debug Leader Election | DebugLeaderElection | "Core" tab |
|Debug Legacy | DebugLegacy | "Security" tab |
|Debug Libraries | DebugLibraries | "Application" tab |
|Debug Lifecycle Manager | DebugLifecycleManager | "Core" tab |
|Debug Load Balancing | DebugLoadBalancing | "Core" tab |
|Debug Local Remote Jvm | DebugLocalRemoteJvm | "Core" tab |
|Debug Logging Configuration | DebugLoggingConfiguration | "Diagnostics" tab |
|Debug MBean Event Handler | DebugMBeanEventHandler | "Diagnostics" tab |
|Debug MBean Event Handler Summary | DebugMBeanEventHandlerSummary | "Diagnostics" tab |
|Debug MBean Event Handler Work | DebugMBeanEventHandlerWork | "Diagnostics" tab |
|Debug MBean Harvester Control | DebugMBeanHarvesterControl | "Diagnostics" tab |
|Debug MBean Harvester Data Collection | DebugMBeanHarvesterDataCollection | "Diagnostics" tab |
|Debug MBean Harvester Resolution | DebugMBeanHarvesterResolution | "Diagnostics" tab |
|Debug MBean Harvester Threading | DebugMBeanHarvesterThreading | "Diagnostics" tab |
|Debug MBean Localization | DebugMBeanLocalization | "Management" tab |
|Debug MBean Type Utility Queue | DebugMBeanTypeUtilQueue | "Diagnostics" tab |
|Debug MBean Type Utility Queue Priority | DebugMBeanTypeUtilQueuePriority | "Diagnostics" tab |
|Debug MBean Type Utility Listener | DebugMBeanTypeUtilityListener | "Diagnostics" tab |
|Debug MBean Typing Utility | DebugMBeanTypingUtility | "Diagnostics" tab |
|Debug Mail Session Deployment | DebugMailSessionDeployment | "Application" tab |
|Debug Managed Bean | DebugManagedBean | "Application" tab |
|Debug Management Services Resource | DebugManagementServicesResource | "Management" tab |
|Debug Mask Criteria | DebugMaskCriteria | "Miscellaneous" tab |
|Debug Messaging | DebugMessaging | "Core" tab |
|Debug Messaging Bridge Runtime | DebugMessagingBridgeRuntime | "Messaging" tab |
|Debug Messaging Bridge Runtime Verbose | DebugMessagingBridgeRuntimeVerbose | "Messaging" tab |
|Debug Messaging Bridge Startup | DebugMessagingBridgeStartup | "Messaging" tab |
|Debug Messaging Kernel | DebugMessagingKernel | "Messaging" tab |
|Debug Messaging Kernel Boot | DebugMessagingKernelBoot | "Messaging" tab |
|Debug Messaging Kernel Verbose | DebugMessagingKernelVerbose | "Messaging" tab |
|Debug Messaging Ownable Lock | DebugMessagingOwnableLock | "Messaging" tab |
|Debug Migration Info | DebugMigrationInfo | "Management" tab |
|Debug Muxer | DebugMuxer | "Core" tab |
|Debug Muxer Concise | DebugMuxerConcise | "Core" tab |
|Debug Muxer Connection | DebugMuxerConnection | "Core" tab |
|Debug Muxer Detail | DebugMuxerDetail | "Core" tab |
|Debug Muxer Exception | DebugMuxerException | "Core" tab |
|Debug Muxer Timeout | DebugMuxerTimeout | "Core" tab |
|Debug NIO | DebugNio | "Core" tab |
|Debug Node Manager Runtime | DebugNodeManagerRuntime | "Core" tab |
|Debug OPatch Utilities | DebugOPatchUtils | "Management" tab |
|Debug Page Flow Monitoring | DebugPageFlowMonitoring | "Miscellaneous" tab |
|Debug Parameters | DebugParameters | "Core" tab |
|Debug Patching Runtime | DebugPatchingRuntime | "Management" tab |
|Debug Path Service | DebugPathSvc | "Messaging" tab |
|Debug Path Service Verbose | DebugPathSvcVerbose | "Messaging" tab |
|Debug Persistent Store Manager | DebugPersistentStoreManager | "Persistence" tab |
|Debug Pub/Sub Bayeux | DebugPubSubBayeux | "Containers" tab |
|Debug Pub/Sub Channel | DebugPubSubChannel | "Containers" tab |
|Debug Pub/Sub Client | DebugPubSubClient | "Containers" tab |
|Debug Pub/Sub MBean | DebugPubSubMBean | "Containers" tab |
|Debug Pub/Sub Security | DebugPubSubSecurity | "Containers" tab |
|Debug Pub/Sub Server | DebugPubSubServer | "Containers" tab |
|Debug Resource Adapter | DebugRA | "Containers" tab |
|Debug Resource Adapter Connection Events | DebugRAConnEvents | "Containers" tab |
|Debug Resource Adapter Connections | DebugRAConnections | "Containers" tab |
|Debug Resource Adapter Deployment | DebugRADeployment | "Containers" tab |
|Debug Resource Adapter Lifecycle | DebugRALifecycle | "Containers" tab |
|Debug Resource Adapter Local Out | DebugRALocalOut | "Containers" tab |
|Debug Resource Adapter Parsing | DebugRAParsing | "Containers" tab |
|Debug Resource Adapter Pool Verbose | DebugRAPoolVerbose | "Containers" tab |
|Debug RA Pooling | DebugRAPooling | "Containers" tab |
|Debug Resource Adapter Security Ctx | DebugRASecurityCtx | "Containers" tab |
|Debug Resource Adapter Work | DebugRAWork | "Containers" tab |
|Debug Resource Adapter Work Events | DebugRAWorkEvents | "Containers" tab |
|Debug Resource Adapter XA in | DebugRAXAin | "Containers" tab |
|Debug Resource Adapter XA out | DebugRAXAout | "Containers" tab |
|Debug Resource Adapter XA work | DebugRAXAwork | "Containers" tab |
|Debug RC4 | DebugRC4 | "Security" tab |
|Debug RSA | DebugRSA | "Security" tab |
|Debug Resource Adapter Classloader | DebugRaClassloader | "Containers" tab |
|Debug ReadyApp | DebugReadyApp | "Application" tab |
|Debug Redefinition Attach | DebugRedefAttach | "Core" tab |
|Debug Replication | DebugReplication | "Core" tab |
|Debug Replication Details | DebugReplicationDetails | "Core" tab |
|Debug Replication Size | DebugReplicationSize | "Core" tab |
|Debug Request Manager | DebugRequestManager | "Core" tab |
|Debug REST Jersey 1 Integration | DebugRestJersey1Integration | "Containers" tab |
|Debug REST Jersey 2 Integration | DebugRestJersey2Integration | "Containers" tab |
|Debug REST Notifications | DebugRestNotifications | "Diagnostics" tab |
|Debug Restart In Place | DebugRestartInPlace | "Core" tab |
|Debug RJVM Request Response | DebugRjvmRequestResponse | "Core" tab |
|Debug RMI Detailed | DebugRmiDetailed | "Core" tab |
|Debug RMI Request Performance | DebugRmiRequestPerf | "Core" tab |
|Debug Routing | DebugRouting | "Core" tab |
|Debug SAF Admin | DebugSAFAdmin | "Messaging" tab |
|Debug SAF Life Cycle | DebugSAFLifeCycle | "Messaging" tab |
|Debug SAF Manager | DebugSAFManager | "Messaging" tab |
|Debug SAF Message Path | DebugSAFMessagePath | "Messaging" tab |
|Debug SAF Receiving Agent | DebugSAFReceivingAgent | "Messaging" tab |
|Debug SAF Sending Agent | DebugSAFSendingAgent | "Messaging" tab |
|Debug SAF Store | DebugSAFStore | "Messaging" tab |
|Debug SAF Transport | DebugSAFTransport | "Messaging" tab |
|Debug SAF Verbose | DebugSAFVerbose | "Messaging" tab |
|Debug SSL | DebugSSL | "Security" tab |
|Debug SCA Container | DebugScaContainer | "Containers" tab |
|Debug Scrubber Start Service | DebugScrubberStartService | "Core" tab |
|Debug Security | DebugSecurity | "Security" tab |
|Debug Security Adjudicator | DebugSecurityAdjudicator | "Security" tab |
|Debug Security Authentication (ATN) | DebugSecurityAtn | "Security" tab |
|Debug Security Authorization (ATZ) | DebugSecurityAtz | "Security" tab |
|Debug Security Auditor | DebugSecurityAuditor | "Security" tab |
|Debug Security Certificate Path | DebugSecurityCertPath | "Security" tab |
|Debug Security Credential Mapping | DebugSecurityCredMap | "Security" tab |
|Debug Security Entitlements Engine | DebugSecurityEEngine | "Security" tab |
|Debug Security Encryption Service | DebugSecurityEncryptionService | "Security" tab |
|Debug Security JACC | DebugSecurityJACC | "Security" tab |
|Debug Security JACC Non-Policy | DebugSecurityJACCNonPolicy | "Security" tab |
|Debug Security JACC Policy | DebugSecurityJACCPolicy | "Security" tab |
|Debug Security Keystore | DebugSecurityKeyStore | "Security" tab |
|Debug Security Password Policy | DebugSecurityPasswordPolicy | "Security" tab |
|Debug Security Predicate | DebugSecurityPredicate | "Security" tab |
|Debug Security Realm | DebugSecurityRealm | "Security" tab |
|Debug Security Role Map | DebugSecurityRoleMap | "Security" tab |
|Debug Security SAML Authentication (ATN) | DebugSecuritySAMLAtn | "Security" tab |
|Debug Security SAML Credential Mapping | DebugSecuritySAMLCredMap | "Security" tab |
|Debug Security SAML Lib | DebugSecuritySAMLLib | "Security" tab |
|Debug Security SSL | DebugSecuritySSL | "Security" tab |
|Debug Security SSL Eaten | DebugSecuritySSLEaten | "Security" tab |
|Debug Security SAML 2 Authentication (ATN) | DebugSecuritySaml2Atn | "Security" tab |
|Debug Security SAML 2 Credential Mapping | DebugSecuritySaml2CredMap | "Security" tab |
|Debug Security SAML 2 Lib | DebugSecuritySaml2Lib | "Security" tab |
|Debug Security SAML 2 Service | DebugSecuritySaml2Service | "Security" tab |
|Debug Security SAML Service | DebugSecuritySamlService | "Security" tab |
|Debug Security Service | DebugSecurityService | "Security" tab |
|Debug Security User Lockout | DebugSecurityUserLockout | "Security" tab |
|Debug Self Tuning | DebugSelfTuning | "Core" tab |
|Debug Server Life Cycle | DebugServerLifeCycle | "Core" tab |
|Debug Server Migration | DebugServerMigration | "Core" tab |
|Debug Server Runtime | DebugServerRuntime | "Core" tab |
|Debug Server Shutdown Handler | DebugServerShutdownHandler | "Core" tab |
|Debug Server Shutdown Statistics | DebugServerShutdownStatistics | "Core" tab |
|Debug Server Shutdown Timer | DebugServerShutdownTimer | "Core" tab |
|Debug Server Start Statistics | DebugServerStartStatistics | "Core" tab |
|Debug Server Startup Timer | DebugServerStartupTimer | "Core" tab |
|Debug Singleton Services | DebugSingletonServices | "Core" tab |
|Debug Singleton Services Concise | DebugSingletonServicesConcise | "Core" tab |
|Debug Situational Config | DebugSituationalConfig | "Management" tab |
|Debug SNMP Agent | DebugSnmpAgent | "Diagnostics" tab |
|Debug SNMP Extension Provider | DebugSnmpExtensionProvider | "Diagnostics" tab |
|Debug SNMP MIB | DebugSnmpMib | "Diagnostics" tab |
|Debug SNMP Protocol TCP | DebugSnmpProtocolTcp | "Diagnostics" tab |
|Debug SNMP Toolkit | DebugSnmpToolkit | "Diagnostics" tab |
|Debug Spring MBeans | DebugSpringMBeans | "Containers" tab |
|Debug Spring Statistics | DebugSpringStatistics | "Containers" tab |
|Debug Store | DebugStore | "Persistence" tab |
|Debug Store Admin | DebugStoreAdmin | "Persistence" tab |
|Debug Store Cache | DebugStoreCache | "Persistence" tab |
|Debug Store Connection Caching | DebugStoreConnectionCaching | "Persistence" tab |
|Debug Store I/O Logical | DebugStoreIOLogical | "Persistence" tab |
|Debug Store I/O Logical Boot | DebugStoreIOLogicalBoot | "Persistence" tab |
|Debug Store I/O Physical | DebugStoreIOPhysical | "Persistence" tab |
|Debug Store I/O Physical Verbose | DebugStoreIOPhysicalVerbose | "Persistence" tab |
|Debug Store Replication and Consistency Manager (RCM) | DebugStoreRcm | "Persistence" tab |
|Debug Store Replication and Consistency Manager (RCM) Verbose | DebugStoreRcmVerbose | "Persistence" tab |
|Debug Store XA | DebugStoreXA | "Persistence" tab |
|Debug Store XA Verbose | DebugStoreXAVerbose | "Persistence" tab |
|Debug Stub Generation | DebugStubGeneration | "Core" tab |
|Debug Tunneling Connection | DebugTunnelingConnection | "Core" tab |
|Debug Tunneling Connection Timeout | DebugTunnelingConnectionTimeout | "Core" tab |
|Debug URL Resolution | DebugURLResolution | "Containers" tab |
|Debug Unicast Messaging | DebugUnicastMessaging | "Core" tab |
|Debug Validate Work Manager | DebugValidateWorkManager | "Management" tab |
|Debug Validation | DebugValidation | "Application" tab |
|Debug Validation Class Loading | DebugValidationClassLoading | "Application" tab |
|Debug WAN Replication Details | DebugWANReplicationDetails | "Containers" tab |
|Debug WAR Extraction | DebugWarExtraction | "Containers" tab |
|Debug Watch Scaling Actions | DebugWatchScalingActions | "Diagnostics" tab |
|Debug Web App Dependency Injection | DebugWebAppDi | "Containers" tab |
|Debug Web App Identity Assertion | DebugWebAppIdentityAssertion | "Containers" tab |
|Debug Web App Module | DebugWebAppModule | "Containers" tab |
|Debug Web App Security | DebugWebAppSecurity | "Containers" tab |
|Debug Web Socket | DebugWebSocket | "Core" tab |
|Debug Work Context | DebugWorkContext | "Core" tab |
|Debug WTC tBridge Execution | DebugWtCtBridgeEx | "Miscellaneous" tab |
|Debug WTC Configuration | DebugWtcConfig | "Miscellaneous" tab |
|Debug WTC CORBA Execution | DebugWtcCorbaEx | "Miscellaneous" tab |
|Debug WTC Gateway Execution | DebugWtcGwtEx | "Miscellaneous" tab |
|Debug WTC JATMI Execution | DebugWtcJatmiEx | "Miscellaneous" tab |
|Debug WTC Tdom PDU | DebugWtcTdomPdu | "Miscellaneous" tab |
|Debug WTC tDom PDU | DebugWtctDomPdu | "Miscellaneous" tab |
|Debug WTC User Data | DebugWtcuData | "Miscellaneous" tab |
|Debug XML Entity Cache Debug Level | DebugXMLEntityCacheDebugLevel | "Miscellaneous" tab |
|Debug XML Entity Cache Debug Name | DebugXMLEntityCacheDebugName | "Miscellaneous" tab |
|Debug XML Entity Cache Include Class | DebugXMLEntityCacheIncludeClass | "Miscellaneous" tab |
|Debug XML Entity Cache Include Location | DebugXMLEntityCacheIncludeLocation | "Miscellaneous" tab |
|Debug XML Entity Cache Include Name | DebugXMLEntityCacheIncludeName | "Miscellaneous" tab |
|Debug XML Entity Cache Include Time | DebugXMLEntityCacheIncludeTime | "Miscellaneous" tab |
|Debug XML Entity Cache Use Short Class | DebugXMLEntityCacheUseShortClass | "Miscellaneous" tab |
|Debug XML Registry Debug Level | DebugXMLRegistryDebugLevel | "Miscellaneous" tab |
|Debug XML Registry Debug Name | DebugXMLRegistryDebugName | "Miscellaneous" tab |
|Debug XML Registry Include Class | DebugXMLRegistryIncludeClass | "Miscellaneous" tab |
|Debug XML Registry Include Location | DebugXMLRegistryIncludeLocation | "Miscellaneous" tab |
|Debug XML Registry Include Name | DebugXMLRegistryIncludeName | "Miscellaneous" tab |
|Debug XML Registry Include Time | DebugXMLRegistryIncludeTime | "Miscellaneous" tab |
|Debug XML Registry Use Short Class | DebugXMLRegistryUseShortClass | "Miscellaneous" tab |
|Default RJVM Diag Messages | DefaultRjvmDiagMessages | "Core" tab |
|Default Store | DefaultStore | "Application" tab |
|Deployment State | DeploymentState | "Application" tab |
|Diagnostic Context Debug Mode | DiagnosticContextDebugMode | "Diagnostics" tab |
|Force GC Each Distributed GC Period | ForceGCEachDGCPeriod | "Core" tab |
|Force Shutdown Timeout Number of Thread Dumps | ForceShutdownTimeoutNumOfThreadDump | "Core" tab |
|Force Shutdown Timeout Thread Dump Interval | ForceShutdownTimeoutThreadDumpInterval | "Core" tab |
|Glass Fish Web App Parser | GlassFishWebAppParser | "Containers" tab |
|Graceful Shutdown Timeout Number Of Thread Dumps | GracefulShutdownTimeoutNumOfThreadDump | "Core" tab |
|Graceful Shutdown Timeout Thread Dump Interval | GracefulShutdownTimeoutThreadDumpInterval | "Core" tab |
|Listen Thread Debug | ListenThreadDebug | "Core" tab |
|Log Distributed GC Statistics | LogDGCStatistics | "Core" tab |
|Magic Thread Dump Back To Socket | MagicThreadDumpBackToSocket | "Management" tab |
|Magic Thread Dump Enabled | MagicThreadDumpEnabled | "Management" tab |
|Magic Thread Dump File | MagicThreadDumpFile | "Management" tab |
|Magic Thread Dump Host | MagicThreadDumpHost | "Management" tab |
|Master Deployer | MasterDeployer | "Application" tab |
|OSGI For Applications | OsGiForApps | "Application" tab |
|Redefining Class Loader | RedefiningClassLoader | "Application" tab |
|Script Executor Command | ScriptExecutorCommand | "Diagnostics" tab |
|Security Encryption Service | SecurityEncryptionService | "Security" tab |
|Server Helper | ServerHelper | "Core" tab |
|Slave Deployer | SlaveDeployer | "Application" tab |
|Startup Timeout Number Of Thread Dumps | StartupTimeoutNumOfThreadDump | "Core" tab |
|Startup Timeout Thread Dump Interval | StartupTimeoutThreadDumpInterval | "Core" tab |
|T3 HTTP Upgrade Handler | T3HttpUpgradeHandler | "Containers" tab |
|WAR Extraction | WarExtraction | "Containers" tab |
|Web Module | WebModule | "Containers" tab |
|Web RJVM Support | WebRjvmSupport | "Containers" tab |

### ServerTemplate / ServerDebug / DebugScope
Navigate to: Topology => Server Templates => (instance) => Server Debug => Debug Scopes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Notes | Notes |  |

### ServerTemplate / ServerDiagnosticConfig
Navigate to: Topology => Server Templates => (instance) => Server Diagnostic Config

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Data Retirement Enabled | DataRetirementEnabled | "General" tab |
|Diagnostic Data Archive Type | DiagnosticDataArchiveType | "General" tab |
|Diagnostic Dumps Directory | DiagnosticDumpsDir | "General" tab => "Advanced" collapsible |
|Diagnostic JDBC Resource | DiagnosticJDBCResource | "General" tab |
|Diagnostic JDBC Schema Name | DiagnosticJdbcSchemaName | "General" tab |
|Diagnostic Store Block Size | DiagnosticStoreBlockSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Directory | DiagnosticStoreDir | "General" tab |
|Diagnostic Store File Locking Enabled | DiagnosticStoreFileLockingEnabled | "General" tab |
|Diagnostic Store I/O Buffer Size | DiagnosticStoreIoBufferSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Max File Size | DiagnosticStoreMaxFileSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Max Window Buffer Size | DiagnosticStoreMaxWindowBufferSize | "General" tab => "Advanced" collapsible |
|Diagnostic Store Min Window Buffer Size | DiagnosticStoreMinWindowBufferSize | "General" tab => "Advanced" collapsible |
|Event Persistence Interval | EventPersistenceInterval | "General" tab => "Advanced" collapsible |
|Events Image Capture Interval | EventsImageCaptureInterval | "General" tab => "Advanced" collapsible |
|Image Directory | ImageDir | "General" tab => "Advanced" collapsible |
|Image Timeout | ImageTimeout | "General" tab => "Advanced" collapsible |
|Max Heap Dump Count | MaxHeapDumpCount | "General" tab => "Advanced" collapsible |
|Max Thread Dump Count | MaxThreadDumpCount | "General" tab => "Advanced" collapsible |
|Notes | Notes | "General" tab |
|Preferred Store Size Limit | PreferredStoreSizeLimit | "General" tab |
|Store Size Check Period | StoreSizeCheckPeriod | "General" tab |
|Synchronous Event Persistence Enabled | SynchronousEventPersistenceEnabled | "General" tab => "Advanced" collapsible |
|WLDF Builtin System Resource Type | WldfBuiltinSystemResourceType | "General" tab |
|WLDF Diagnostic Volume | WldfDiagnosticVolume | "General" tab |

### ServerTemplate / ServerDiagnosticConfig / WldfBuiltinWatchConfiguration
Navigate to: Topology => Server Templates => (instance) => Server Diagnostic Config => WLDF Builtin Watch Configuration

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Stuck Thread Diagnostic Image Notification Enabled | StuckThreadDiagnosticImageNotificationEnabled |  |
|Stuck Thread Thread Dump Action Count | StuckThreadThreadDumpActionCount |  |
|Stuck Thread Thread Dump Action Delay Seconds | StuckThreadThreadDumpActionDelaySeconds |  |
|Stuck Thread Thread Dump Action Enabled | StuckThreadThreadDumpActionEnabled |  |
|Stuck Thread Watch Enabled | StuckThreadWatchEnabled |  |

### ServerTemplate / ServerStart
Navigate to: Topology => Server Templates => (instance) => Server Start

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class Path | ClassPath |  |
|Java Home | JavaHome |  |
|Java Vendor | JavaVendor |  |
|Arguments | Arguments |  |
|Middleware Home | MwHome |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Root Directory | RootDirectory |  |
|Security Policy File | SecurityPolicyFile |  |
|Username | Username |  |

### ServerTemplate / SingleSignOnServices
Navigate to: Topology => Server Templates => (instance) => Single Sign-On Services

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allowed Target Hosts | AllowedTargetHost | "SAML 2.0 Service Provider" tab |
|Artifact Max Cache Size | ArtifactMaxCacheSize | "SAML 2.0 General" tab |
|Artifact Timeout | ArtifactTimeout | "SAML 2.0 General" tab |
|Assertion Encryption Decryption Key Alias | AssertionEncryptionDecryptionKeyAlias | "SAML 2.0 Service Provider" tab |
|Assertion Encryption Decryption Key Passphrase | AssertionEncryptionDecryptionKeyPassPhraseEncrypted | "SAML 2.0 Service Provider" tab |
|Assertion Encryption Enabled | AssertionEncryptionEnabled | "SAML 2.0 Identity Provider" tab |
|Assertion Subject Session Timeout Check Enabled | AssertionSubjectSessionTimeoutCheckEnabled | "SAML 2.0 Service Provider" tab |
|Authentication Request Max Cache Size | AuthnRequestMaxCacheSize | "SAML 2.0 Service Provider" tab |
|Authentication Request Timeout | AuthnRequestTimeout | "SAML 2.0 Service Provider" tab |
|Basic Auth Password | BasicAuthPasswordEncrypted | "SAML 2.0 General" tab |
|Basic Auth Username | BasicAuthUsername | "SAML 2.0 General" tab |
|Contact Person Company | ContactPersonCompany | "SAML 2.0 General" tab |
|Contact Person Email Address | ContactPersonEmailAddress | "SAML 2.0 General" tab |
|Contact Person Given Name | ContactPersonGivenName | "SAML 2.0 General" tab |
|Contact Person Surname | ContactPersonSurName | "SAML 2.0 General" tab |
|Contact Person Telephone Number | ContactPersonTelephoneNumber | "SAML 2.0 General" tab |
|Contact Person Type | ContactPersonType | "SAML 2.0 General" tab |
|Data Encryption Algorithm | DataEncryptionAlgorithm | "SAML 2.0 Identity Provider" tab |
|Default URL | DefaultUrl | "SAML 2.0 Service Provider" tab |
|Entity ID | EntityId | "SAML 2.0 General" tab |
|Force Authentication | ForceAuthn | "SAML 2.0 Service Provider" tab |
|Identity Provider Artifact Binding Enabled | IdentityProviderArtifactBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Enabled | IdentityProviderEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Post Binding Enabled | IdentityProviderPostBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Identity Provider Preferred Binding | IdentityProviderPreferredBinding | "SAML 2.0 Identity Provider" tab |
|Identity Provider Redirect Binding Enabled | IdentityProviderRedirectBindingEnabled | "SAML 2.0 Identity Provider" tab |
|Key Encryption Algorithm | KeyEncryptionAlgorithm | "SAML 2.0 Identity Provider" tab |
|Login Return Query Parameter | LoginReturnQueryParameter | "SAML 2.0 Identity Provider" tab |
|Login URL | LoginUrl | "SAML 2.0 Identity Provider" tab |
|Metadata Encryption Algorithms | MetadataEncryptionAlgorithm | "SAML 2.0 Service Provider" tab |
|Notes | Notes | "SAML 2.0 General" tab |
|Organization Name | OrganizationName | "SAML 2.0 General" tab |
|Organization URL | OrganizationUrl | "SAML 2.0 General" tab |
|Passive | Passive | "SAML 2.0 Service Provider" tab |
|Post One-Use Check Enabled | PostOneUseCheckEnabled | "SAML 2.0 General" tab |
|Published Site URL | PublishedSiteUrl | "SAML 2.0 General" tab |
|Recipient Check Enabled | RecipientCheckEnabled | "SAML 2.0 General" tab |
|Replicated Cache Enabled | ReplicatedCacheEnabled | "SAML 2.0 General" tab |
|Service Provider Artifact Binding Enabled | ServiceProviderArtifactBindingEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Enabled | ServiceProviderEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Post Binding Enabled | ServiceProviderPostBindingEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Preferred Binding | ServiceProviderPreferredBinding | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Binding | ServiceProviderSingleLogoutBinding | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Enabled | ServiceProviderSingleLogoutEnabled | "SAML 2.0 Service Provider" tab |
|Service Provider Single Logout Redirect URIs | ServiceProviderSingleLogoutRedirectUri | "SAML 2.0 Service Provider" tab |
|Sign Authentication Requests | SignAuthnRequests | "SAML 2.0 Service Provider" tab |
|SSO Signing Key Alias | SsoSigningKeyAlias | "SAML 2.0 General" tab |
|SSO Signing Key Passphrase | SsoSigningKeyPassPhraseEncrypted | "SAML 2.0 General" tab |
|Transport Layer Security Key Alias | TransportLayerSecurityKeyAlias | "SAML 2.0 General" tab |
|Transport Layer Security Key Passphrase | TransportLayerSecurityKeyPassPhraseEncrypted | "SAML 2.0 General" tab |
|Want Artifact Requests Signed | WantArtifactRequestsSigned | "SAML 2.0 General" tab |
|Want Assertions Signed | WantAssertionsSigned | "SAML 2.0 Service Provider" tab |
|Want Authentication Requests Signed | WantAuthnRequestsSigned | "SAML 2.0 Identity Provider" tab |
|Want Basic Auth Client Authentication | WantBasicAuthClientAuthentication | "SAML 2.0 General" tab |
|Want Responses Signed | WantResponsesSigned | "SAML 2.0 Service Provider" tab |
|Want Transport Layer Security Client Authentication | WantTransportLayerSecurityClientAuthentication | "SAML 2.0 General" tab |

### ServerTemplate / TransactionLogJDBCStore
Navigate to: Topology => Server Templates => (instance) => Transaction Log JDBC Store

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Caching Policy | ConnectionCachingPolicy | "Tuning Parameters" tab |
|Create Table DDL File | CreateTableDDLFile | "General" tab => "Advanced" collapsible |
|Data Source | DataSource | "General" tab |
|Deletes Per Batch Maximum | DeletesPerBatchMaximum | "Tuning Parameters" tab |
|Deletes Per Statement Maximum | DeletesPerStatementMaximum | "Tuning Parameters" tab |
|Distribution Policy | DistributionPolicy | "High Availability" tab |
|Enabled | Enabled | "General" tab |
|Failback Delay Seconds | FailbackDelaySeconds | "High Availability" tab |
|Fail Over Limit | FailOverLimit | "High Availability" tab |
|Initial Boot Delay Seconds | InitialBootDelaySeconds | "High Availability" tab |
|Inserts Per Batch Maximum | InsertsPerBatchMaximum | "Tuning Parameters" tab |
|Logical Name | LogicalName | "General" tab => "Advanced" collapsible |
|Max Retry Seconds Before TLOG Fail | MaxRetrySecondsBeforeTlogFail | "Tuning Parameters" tab |
|Max Retry Seconds Before Transaction Exception | MaxRetrySecondsBeforeTxException | "Tuning Parameters" tab |
|Migration Policy | MigrationPolicy | "High Availability" tab |
|Notes | Notes | "General" tab |
|Number Of Restart Attempts | NumberOfRestartAttempts | "High Availability" tab |
|Oracle Piggyback Commit Enabled | OraclePiggybackCommitEnabled | "Tuning Parameters" tab |
|Partial Cluster Stability Delay Seconds | PartialClusterStabilityDelaySeconds | "High Availability" tab |
|Prefix Name | PrefixName | "General" tab |
|Rebalance Enabled | RebalanceEnabled | "High Availability" tab |
|Reconnect Retry Interval Milliseconds | ReconnectRetryIntervalMillis | "High Availability" tab |
|Reconnect Retry Period Milliseconds | ReconnectRetryPeriodMillis | "High Availability" tab |
|Restart In Place | RestartInPlace | "High Availability" tab |
|Retry Interval Seconds | RetryIntervalSeconds | "Tuning Parameters" tab |
|Seconds Between Restarts | SecondsBetweenRestarts | "High Availability" tab |
|Three Step Threshold | ThreeStepThreshold | "Tuning Parameters" tab |
|Worker Count | WorkerCount | "Tuning Parameters" tab |
|Worker Preferred Batch Size | WorkerPreferredBatchSize | "Tuning Parameters" tab |
|XA Resource Name | XAResourceName | "General" tab => "Advanced" collapsible |

### ServerTemplate / WebServer
Navigate to: Topology => Server Templates => (instance) => Web Server

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Context Path In Get Real Path | AcceptContextPathInGetRealPath |  |
|Authentication Cookie Enabled | AuthCookieEnabled | "Advanced" collapsible |
|Character Sets | Charsets | "Advanced" collapsible |
|Chunked Transfer Disabled | ChunkedTransferDisabled | "Advanced" collapsible |
|Client IP Header | ClientIpHeader |  |
|Default Web App Context Root | DefaultWebAppContextRoot |  |
|Frontend HTTP Port | FrontendHTTPPort |  |
|Frontend HTTPS Port | FrontendHTTPSPort |  |
|Frontend Host | FrontendHost |  |
|HTTPS Keep Alive Seconds | HttpsKeepAliveSecs |  |
|Keep Alive Enabled | KeepAliveEnabled |  |
|Keep Alive Seconds | KeepAliveSecs |  |
|Max Post Size | MaxPostSize |  |
|Max Post Time Secs | MaxPostTimeSecs |  |
|Max Request Parameter Count | MaxRequestParameterCount |  |
|Max Single Header Size | MaxSingleHeaderSize |  |
|Max Total Headers Size | MaxTotalHeadersSize |  |
|Notes | Notes |  |
|Overload Response Code | OverloadResponseCode | "Advanced" collapsible |
|Post Timeout Seconds | PostTimeoutSecs |  |
|Send Server Header Enabled | SendServerHeaderEnabled |  |
|Single Sign-On Disabled | SingleSignonDisabled | "Advanced" collapsible |
|URL Resources | URLResource | "Advanced" collapsible |
|Use Header Encoding | UseHeaderEncoding | "Advanced" collapsible |
|Use Highest Compatible HTTP Version | UseHighestCompatibleHTTPVersion | "Advanced" collapsible |
|WAP Enabled | WAPEnabled |  |

### ServerTemplate / WebServer / WebServerLog
Navigate to: Topology => Server Templates => (instance) => Web Server => Web Server Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|ELF Fields | ELFFields | "Advanced" collapsible |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Format | LogFileFormat |  |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log Time In GMT | LogTimeInGMT | "Advanced" collapsible |
|Logging Enabled | LoggingEnabled |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### ServerTemplate / WebService
Navigate to: Topology => Server Templates => (instance) => Web Service

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Callback Queue | CallbackQueue |  |
|Callback Queue MDB Run As Principal Name | CallbackQueueMdbRunAsPrincipalName |  |
|JMS Connection Factory | JmsConnectionFactory |  |
|Messaging Queue | MessagingQueue |  |
|Messaging Queue MDB Run As Principal Name | MessagingQueueMdbRunAsPrincipalName |  |
|Notes | Notes |  |

### ServerTemplate / WebService / WebServiceBuffering
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Buffering

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Retry Count | RetryCount |  |
|Retry Delay | RetryDelay |  |

### ServerTemplate / WebService / WebServiceBuffering / WebServiceRequestBufferingQueue
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Buffering => Web Service Request Buffering Queue

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Transaction Enabled | TransactionEnabled |  |

### ServerTemplate / WebService / WebServiceBuffering / WebServiceResponseBufferingQueue
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Buffering => Web Service Response Buffering Queue

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Enabled | Enabled |  |
|Notes | Notes |  |
|Transaction Enabled | TransactionEnabled |  |

### ServerTemplate / WebService / WebServicePersistence
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Persistence

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Logical Store Name | DefaultLogicalStoreName |  |
|Notes | Notes |  |

### ServerTemplate / WebService / WebServicePersistence / WebServiceLogicalStore
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Persistence => Web Service Logical Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cleaner Interval | CleanerInterval |  |
|Default Maximum Object Lifetime | DefaultMaximumObjectLifetime |  |
|Notes | Notes |  |
|Persistence Strategy | PersistenceStrategy |  |
|Physical Store Name | PhysicalStoreName |  |
|Request Buffering Queue JNDI Name | RequestBufferingQueueJndiName |  |
|Response Buffering Queue JNDI Name | ResponseBufferingQueueJndiName |  |

### ServerTemplate / WebService / WebServicePersistence / WebServicePhysicalStore
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Persistence => Web Service Physical Stores => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Location | Location |  |
|Notes | Notes |  |
|Store Type | StoreType |  |
|Synchronous Write Policy | SynchronousWritePolicy |  |

### ServerTemplate / WebService / WebServiceReliability
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Reliability

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Acknowledgement Interval | AcknowledgementInterval |  |
|Base Retransmission Interval | BaseRetransmissionInterval |  |
|Inactivity Timeout | InactivityTimeout |  |
|Non-Buffered Destination | NonBufferedDestination |  |
|Non-Buffered Source | NonBufferedSource |  |
|Notes | Notes |  |
|Retransmission Exponential Backoff | RetransmissionExponentialBackoff |  |
|Sequence Expiration | SequenceExpiration |  |

### ServerTemplate / WebService / WebServiceResiliency
Navigate to: Topology => Server Templates => (instance) => Web Service => Web Service Resiliency

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Retry Count | RetryCount |  |
|Retry Delay | RetryDelay |  |

### ShutdownClass
Navigate to: Resources => Shutdown Classes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Arguments | Arguments |  |
|Class Name | ClassName |  |
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Targets | Target |  |

### SingletonService
Navigate to: Resources => Singleton Services => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Additional Migration Attempts | AdditionalMigrationAttempts | "Migration" tab |
|Class Name | ClassName | "General" tab |
|Cluster | Cluster | "General" tab |
|Constrained Candidate Servers | ConstrainedCandidateServer | "Migration" tab |
|Milliseconds To Sleep Between Attempts | MillisToSleepBetweenAttempts | "Migration" tab |
|User Preferred Server | UserPreferredServer | "Migration" tab |
|Notes | Notes | "General" tab |

### SnmpAgentDeployment
Navigate to: Resources => SNMP Agent Deployments => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Authentication Protocol | AuthenticationProtocol |  |
|Community-Based Access Enabled | CommunityBasedAccessEnabled |  |
|Community Prefix | CommunityPrefix |  |
|Deployment Order | DeploymentOrder |  |
|Enabled | Enabled |  |
|Inform Enabled | InformEnabled |  |
|Inform Retry Interval | InformRetryInterval |  |
|Listen Address | ListenAddress |  |
|Localized Key Cache Invalidation Interval | LocalizedKeyCacheInvalidationInterval |  |
|Master AgentX Port | MasterAgentXPort |  |
|Max Inform Retry Count | MaxInformRetryCount |  |
|Notes | Notes |  |
|Privacy Protocol | PrivacyProtocol |  |
|SNMP Port | SNMPPort |  |
|SNMP Trap Version | SNMPTrapVersion |  |
|Send Automatic Traps Enabled | SendAutomaticTrapsEnabled |  |
|SNMP Access For User MBeans Enabled | SnmpAccessForUserMBeansEnabled |  |
|SNMP Engine ID | SnmpEngineId |  |
|Targets | Target |  |

### SnmpAgentDeployment / SNMPAttributeChange
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Attribute Changes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Attribute MBean Name | AttributeMBeanName |  |
|Attribute MBean Type | AttributeMBeanType |  |
|Attribute Name | AttributeName |  |
|Enabled Servers | EnabledServer |  |
|Notes | Notes |  |

### SnmpAgentDeployment / SNMPCounterMonitor
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Counter Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Modulus | Modulus |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Offset | Offset |  |
|Polling Interval | PollingInterval |  |
|Threshold | Threshold |  |

### SnmpAgentDeployment / SNMPGaugeMonitor
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Gauge Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Polling Interval | PollingInterval |  |
|Threshold High | ThresholdHigh |  |
|Threshold Low | ThresholdLow |  |

### SnmpAgentDeployment / SNMPLogFilter
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Log Filters => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Message IDs | MessageId |  |
|Message Substring | MessageSubstring |  |
|Notes | Notes |  |
|Severity Level | SeverityLevel |  |
|Subsystem Names | SubsystemName |  |
|User IDs | UserId |  |

### SnmpAgentDeployment / SNMPProxy
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Proxies => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Community | Community |  |
|Listen Address | ListenAddress |  |
|Notes | Notes |  |
|OID Root | OidRoot |  |
|Port | Port |  |
|Security Level | SecurityLevel |  |
|Security Name | SecurityName |  |
|Timeout | Timeout |  |

### SnmpAgentDeployment / SNMPStringMonitor
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP String Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled Servers | EnabledServer |  |
|Monitored Attribute Name | MonitoredAttributeName |  |
|Monitored MBean Name | MonitoredMBeanName |  |
|Monitored MBean Type | MonitoredMBeanType |  |
|Notes | Notes |  |
|Notify Differ | NotifyDiffer |  |
|Notify Match | NotifyMatch |  |
|Polling Interval | PollingInterval |  |
|String To Compare | StringToCompare |  |

### SnmpAgentDeployment / SNMPTrapDestination
Navigate to: Resources => SNMP Agent Deployments => (instance) => SNMP Trap Destinations => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Community | Community |  |
|Host | Host |  |
|Notes | Notes |  |
|Port | Port |  |
|Security Level | SecurityLevel |  |
|Security Name | SecurityName |  |

### StartupClass
Navigate to: Resources => Startup Classes => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Arguments | Arguments |  |
|Class Name | ClassName |  |
|Deployment Order | DeploymentOrder |  |
|Failure Is Fatal | FailureIsFatal | "Advanced" collapsible |
|Load After Apps Running | LoadAfterAppsRunning | "Advanced" collapsible |
|Load Before App Activation | LoadBeforeAppActivation | "Advanced" collapsible |
|Load Before App Deployments | LoadBeforeAppDeployments | "Advanced" collapsible |
|Notes | Notes |  |
|Targets | Target |  |

### SystemComponent
Navigate to: Resources => System Components => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Auto Restart | AutoRestart |  |
|Component Type | ComponentType |  |
|Machine | Machine |  |
|Node Manager Socket Create Timeout In Milliseconds | NMSocketCreateTimeoutInMillis |  |
|Notes | Notes |  |
|Restart Delay Seconds | RestartDelaySeconds |  |
|Restart Interval Seconds | RestartIntervalSeconds |  |
|Restart Max | RestartMax |  |

### SystemComponent / SystemComponentStart
Navigate to: Resources => System Components => (instance) => System Component Start

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Arguments | Arguments |  |
|Class Path | ClassPath |  |
|Java Home | JavaHome |  |
|Java Vendor | JavaVendor |  |
|Middleware Home | MwHome |  |
|Notes | Notes |  |
|Root Directory | RootDirectory |  |

### Topology
Navigate to: Topology

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Admin Server Name | AdminServerName |  |
|Administration Port | AdministrationPort |  |
|Administration Port Enabled | AdministrationPortEnabled |  |
|Administration Protocol | AdministrationProtocol | "Advanced" collapsible |
|Archive Configuration Count | ArchiveConfigurationCount | "Advanced" collapsible |
|Batch Jobs Data Source JNDI Name | BatchJobsDataSourceJndiName | "Advanced" collapsible |
|Batch Jobs Executor Service Name | BatchJobsExecutorServiceName | "Advanced" collapsible |
|Cluster Constraints Enabled | ClusterConstraintsEnabled | "Advanced" collapsible |
|Configuration Backup Enabled | ConfigBackupEnabled | "Advanced" collapsible |
|Configuration Audit Type | ConfigurationAuditType | "Advanced" collapsible |
|Console Context Path | ConsoleContextPath | "Advanced" collapsible |
|Console Enabled | ConsoleEnabled | "Advanced" collapsible |
|Console Extension Directory | ConsoleExtensionDirectory | "Advanced" collapsible |
|DB Passive Mode | DbPassiveMode | "Advanced" collapsible |
|DB Passive Mode Grace Period Seconds | DbPassiveModeGracePeriodSeconds | "Advanced" collapsible |
|Diagnostic Context Compatibility Mode Enabled | DiagnosticContextCompatibilityModeEnabled | "Advanced" collapsible |
|Enable EE-Compliant Classloading For Embedded Adapters | EnableEeCompliantClassloadingForEmbeddedAdapters | "Advanced" collapsible |
|Exalogic Optimizations Enabled | ExalogicOptimizationsEnabled | "Advanced" collapsible |
|Installed Software Version | InstalledSoftwareVersion | "Advanced" collapsible |
|Internal Apps Deploy On Demand Enabled | InternalAppsDeployOnDemandEnabled | "Advanced" collapsible |
|Java Service Console Enabled | JavaServiceConsoleEnabled | "Advanced" collapsible |
|Java Service Enabled | JavaServiceEnabled |  |
|Listen Port Enabled | ListenPortEnabled |  |
|Log Format Compatibility Enabled | LogFormatCompatibilityEnabled | "Advanced" collapsible |
|Max Concurrent Long Running Requests | MaxConcurrentLongRunningRequests | "Advanced" collapsible |
|Max Concurrent New Threads | MaxConcurrentNewThreads | "Advanced" collapsible |
|Name | Name |  |
|Notes | Notes |  |
|Parallel Deploy Application Modules | ParallelDeployApplicationModules | "Advanced" collapsible |
|Parallel Deploy Applications | ParallelDeployApplications | "Advanced" collapsible |
|Production Mode Enabled | ProductionModeEnabled |  |
|Remote Console Helper Enabled | RemoteConsoleHelperEnabled |  |
|SSL Enabled | SSLEnabled |  |
|Server Keystores | ServerKeyStores |  |
|Server Migration History Size | ServerMigrationHistorySize | "Advanced" collapsible |
|Service Migration History Size | ServiceMigrationHistorySize | "Advanced" collapsible |
|Site Name | SiteName | "Advanced" collapsible |

### UnixMachine
Navigate to: Topology => Unix Machines => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Notes | Notes |  |
|Post Bind GID | PostBindGID |  |
|Post Bind GID Enabled | PostBindGIDEnabled |  |
|Post Bind UID | PostBindUID |  |
|Post Bind UID Enabled | PostBindUIDEnabled |  |

### UnixMachine / NodeManager
Navigate to: Topology => Unix Machines => (instance) => Node Manager

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Debug Enabled | DebugEnabled |  |
|Listen Address | ListenAddress |  |
|Listen Port | ListenPort |  |
|Node Manager Socket Create Timeout In Milliseconds | NMSocketCreateTimeoutInMillis |  |
|Node Manager Type | NMType |  |
|Node Manager Home | NodeManagerHome |  |
|Notes | Notes |  |
|Password | PasswordEncrypted |  |
|Shell Command | ShellCommand |  |
|User Name | UserName |  |

### VirtualHost
Navigate to: Topology => Virtual Hosts => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accept Context Path In Get Real Path | AcceptContextPathInGetRealPath |  |
|Authentication Cookie Enabled | AuthCookieEnabled | "Advanced" collapsible |
|Character Sets | Charsets | "Advanced" collapsible |
|Chunked Transfer Disabled | ChunkedTransferDisabled | "Advanced" collapsible |
|Client IP Header | ClientIpHeader |  |
|Default Web App Context Root | DefaultWebAppContextRoot |  |
|Deployment Order | DeploymentOrder |  |
|Frontend HTTP Port | FrontendHTTPPort |  |
|Frontend HTTPS Port | FrontendHTTPSPort |  |
|Frontend Host | FrontendHost |  |
|HTTPS Keep Alive Seconds | HttpsKeepAliveSecs |  |
|Keep Alive Enabled | KeepAliveEnabled |  |
|Keep Alive Seconds | KeepAliveSecs |  |
|Max Post Size | MaxPostSize |  |
|Max Post Time Secs | MaxPostTimeSecs |  |
|Max Request Parameter Count | MaxRequestParameterCount |  |
|Max Single Header Size | MaxSingleHeaderSize |  |
|Max Total Headers Size | MaxTotalHeadersSize |  |
|Network Access Point | NetworkAccessPoint |  |
|Notes | Notes |  |
|Overload Response Code | OverloadResponseCode | "Advanced" collapsible |
|Post Timeout Seconds | PostTimeoutSecs |  |
|Send Server Header Enabled | SendServerHeaderEnabled |  |
|Single Sign-On Disabled | SingleSignonDisabled | "Advanced" collapsible |
|Targets | Target |  |
|URL Resources | URLResource | "Advanced" collapsible |
|Use Header Encoding | UseHeaderEncoding | "Advanced" collapsible |
|Use Highest Compatible HTTP Version | UseHighestCompatibleHTTPVersion | "Advanced" collapsible |
|Virtual Host Names | VirtualHostName |  |
|WAP Enabled | WAPEnabled |  |

### VirtualHost / WebServerLog
Navigate to: Topology => Virtual Hosts => (instance) => Web Server Log

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Buffer Size in Kilobytes | BufferSizeKb | "Advanced" collapsible |
|Date Format Pattern | DateFormatPattern | "Advanced" collapsible |
|ELF Fields | ELFFields | "Advanced" collapsible |
|File Count | FileCount |  |
|File Min Size | FileMinSize |  |
|File Name | FileName |  |
|File Time Span | FileTimeSpan |  |
|File Time Span Factor | FileTimeSpanFactor |  |
|Log File Format | LogFileFormat |  |
|Log File Rotation Directory | LogFileRotationDir |  |
|Log Time In GMT | LogTimeInGMT | "Advanced" collapsible |
|Logging Enabled | LoggingEnabled |  |
|Notes | Notes |  |
|Number Of Files Limited | NumberOfFilesLimited |  |
|Rotate Log On Startup | RotateLogOnStartup |  |
|Rotation Time | RotationTime |  |
|Rotation Type | RotationType |  |

### WLDFSystemResource
Navigate to: Resources => WLDF System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Name | CompatibilityName | "Advanced" collapsible |
|Deployment Order | DeploymentOrder |  |
|Deployment Principal Name | DeploymentPrincipalName | "Advanced" collapsible |
|Description | Description |  |
|Descriptor File Name | DescriptorFileName |  |
|Module Type | ModuleType | "Advanced" collapsible |
|Notes | Notes |  |
|Targets | Target |  |

### WLDFSystemResource / WLDFResource
Navigate to: Resources => WLDF System Resources => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### WLDFSystemResource / WLDFResource / Harvester
Navigate to: Resources => WLDF System Resources => (instance) => Harvester

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Sample Period | SamplePeriod |  |

### WLDFSystemResource / WLDFResource / Harvester / HarvestedType
Navigate to: Resources => WLDF System Resources => (instance) => Harvester => Harvested Types => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Harvested Attributes | HarvestedAttribute |  |
|Harvested Instances | HarvestedInstance |  |
|Known Type | KnownType |  |
|Namespace | Namespace |  |

### WLDFSystemResource / WLDFResource / Instrumentation
Navigate to: Resources => WLDF System Resources => (instance) => Instrumentation

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Excludes | Exclude |  |
|Includes | Include |  |

### WLDFSystemResource / WLDFResource / Instrumentation / WLDFInstrumentationMonitor
Navigate to: Resources => WLDF System Resources => (instance) => Instrumentation => WLDF Instrumentation Monitors => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Action | Action |  |
|Description | Description |  |
|Dye Filtering Enabled | DyeFilteringEnabled |  |
|Dye Mask | DyeMask |  |
|Enabled | Enabled |  |
|Excludes | Exclude |  |
|Includes | Include |  |
|Location Type | LocationType |  |
|Pointcut | Pointcut |  |
|Properties | Properties |  |

### WLDFSystemResource / WLDFResource / WatchNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Log Watch Severity | LogWatchSeverity |  |
|Severity | Severity |  |
|Enabled | Enabled |  |

### WLDFSystemResource / WLDFResource / WatchNotification / HeapDumpAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Heap Dump Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Live Set Only | LiveSetOnly |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / ImageNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Image Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Image Directory | ImageDirectory |  |
|Image Lockout | ImageLockout |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / JMSNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => JMS Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Connection Factory JNDI Name | ConnectionFactoryJndiName |  |
|Destination JNDI Name | DestinationJndiName |  |
|Enabled | Enabled |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / JMXNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => JMX Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Notification Type | NotificationType |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / LogAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Log Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Message | Message |  |
|Severity | Severity |  |
|Subsystem Name | SubsystemName |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / RestNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => REST Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Accepted Response Type | AcceptedResponseType |  |
|Custom Notification Properties | CustomNotificationProperties |  |
|Enabled | Enabled |  |
|Endpoint URL | EndpointUrl |  |
|HTTP Authentication Mode | HttpAuthenticationMode |  |
|HTTP Authentication Password | HttpAuthenticationPasswordEncrypted |  |
|HTTP Authentication User Name | HttpAuthenticationUserName |  |
|REST Invocation Method Type | RestInvocationMethodType |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / SMTPNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => SMTP Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Body | Body |  |
|Enabled | Enabled |  |
|Mail Session JNDI Name | MailSessionJndiName |  |
|Recipients | Recipient |  |
|Subject | Subject |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / SNMPNotification
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => SNMP Notifications => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / ScaleDownAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Scale Down Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cluster Name | ClusterName |  |
|Enabled | Enabled |  |
|Scaling Size | ScalingSize |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / ScaleUpAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Scale Up Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cluster Name | ClusterName |  |
|Enabled | Enabled |  |
|Scaling Size | ScalingSize |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / ScriptAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Script Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Environment Variables | Environment |  |
|Parameter | Parameter |  |
|Path To Script | PathToScript |  |
|Timeout | Timeout |  |
|Working Directory | WorkingDirectory |  |

### WLDFSystemResource / WLDFResource / WatchNotification / ThreadDumpAction
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Thread Dump Actions => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Enabled | Enabled |  |
|Thread Dump Count | ThreadDumpCount |  |
|Thread Dump Delay Seconds | ThreadDumpDelaySeconds |  |
|Timeout | Timeout |  |

### WLDFSystemResource / WLDFResource / WatchNotification / Watch
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Watches => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Alarm Reset Period | AlarmResetPeriod |  |
|Alarm Type | AlarmType |  |
|Enabled | Enabled |  |
|Expression Language | ExpressionLanguage |  |
|Notifications | Notification |  |
|Rule Expression | RuleExpression |  |
|Rule Type | RuleType |  |
|Severity | Severity |  |

### WLDFSystemResource / WLDFResource / WatchNotification / Watch / Schedule
Navigate to: Resources => WLDF System Resources => (instance) => Watch Notification => Watches => (instance) => Schedule

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Day Of Month | DayOfMonth |  |
|Day Of Week | DayOfWeek |  |
|Hour | Hour |  |
|Minute | Minute |  |
|Month | Month |  |
|Second | Second |  |
|Timezone | Timezone |  |
|Year | Year |  |

### WLSPolicies
Navigate to: Domain Info => WLS Policies => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Resource ID | ResourceID |  |
|Policy | Policy |  |
|XACML Document | XacmlDocument | "Advanced" collapsible |
|XACML Status | XacmlStatus | "Advanced" collapsible |

### WLSRoles
Navigate to: Domain Info => WLS Roles => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Expression | Expression |  |
|Update Mode | UpdateMode |  |
|XACML Document | XacmlDocument | "Advanced" collapsible |
|XACML Status | XacmlStatus | "Advanced" collapsible |

### WLSUserPasswordCredentialMappings
Navigate to: Domain Info => WLS Credential Mappings

| Attribute Name | Model Key | Location |
|------|----------|------------------|

### WLSUserPasswordCredentialMappings / CrossDomain
Navigate to: Domain Info => WLS Credential Mappings => Cross-Domain Mappings => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Remote Domain | RemoteDomain |  |
|Remote Password | RemotePassword |  |
|Remote User | RemoteUser |  |

### WLSUserPasswordCredentialMappings / RemoteResource
Navigate to: Domain Info => WLS Credential Mappings => Remote Resource Mappings => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Method | Method |  |
|Path | Path |  |
|Protocol | Protocol |  |
|Remote Host | RemoteHost |  |
|Remote Password | RemotePassword |  |
|Remote Port | RemotePort |  |
|Remote User | RemoteUser |  |
|Users | User |  |

### WSReliableDeliveryPolicy
Navigate to: Topology => WS Reliable Delivery Policies => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Default Retry Count | DefaultRetryCount |  |
|Default Retry Interval | DefaultRetryInterval |  |
|Default Time-to-Live | DefaultTimeToLive |  |
|JMS Server | JMSServer |  |
|Notes | Notes |  |

### WTCServer
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Deployment Order | DeploymentOrder |  |
|Notes | Notes |  |
|Targets | Target |  |

### WTCServer / WTCExport
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Exports => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|EJB Name | EJBName |  |
|Local Access Point | LocalAccessPoint |  |
|Notes | Notes |  |
|Remote Name | RemoteName |  |
|Resource Name | ResourceName |  |
|Target Class | TargetClass |  |
|Target Jar | TargetJar |  |

### WTCServer / WTCImport
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Imports => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local Access Point | LocalAccessPoint |  |
|Notes | Notes |  |
|Remote Access Point List | RemoteAccessPointList |  |
|Remote Name | RemoteName |  |
|Resource Name | ResourceName |  |

### WTCServer / WTCLocalTuxDom
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Local Tuxedo Domains => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Access Point | AccessPoint | "General" tab |
|Access Point ID | AccessPointId | "General" tab |
|Block Time | BlockTime | "Connection Properties" tab |
|Compression Limit | CmpLimit | "Connection Properties" tab |
|Connection Principal Name | ConnPrincipalName | "Connection Properties" tab |
|Connection Policy | ConnectionPolicy | "Connection Properties" tab |
|Identity Keystore File Name | IdentityKeyStoreFileName | "Security Configuration" tab |
|Identity Keystore Passphrase | IdentityKeyStorePassPhraseEncrypted | "Security Configuration" tab |
|Interoperate | Interoperate | "Connection Properties" tab |
|Keep Alive | KeepAlive | "Connection Properties" tab |
|Keep Alive Wait | KeepAliveWait | "Connection Properties" tab |
|Keystores Location | KeyStoresLocation | "Security Configuration" tab |
|Max Encrypt Bits | MaxEncryptBits | "Security Configuration" tab |
|Max Retries | MaxRetries | "Connection Properties" tab |
|Min Encrypt Bits | MinEncryptBits | "Security Configuration" tab |
|Network Address | NWAddr | "General" tab |
|Notes | Notes | "General" tab |
|Private Key Alias | PrivateKeyAlias | "Security Configuration" tab |
|Private Key Passphrase | PrivateKeyPassPhraseEncrypted | "Security Configuration" tab |
|Retry Interval | RetryInterval | "Connection Properties" tab |
|Security | Security | "Security Configuration" tab |
|SSL Protocol Version | SslProtocolVersion | "Security Configuration" tab |
|Trust Keystore File Name | TrustKeyStoreFileName | "Security Configuration" tab |
|Trust Keystore Passphrase | TrustKeyStorePassPhraseEncrypted | "Security Configuration" tab |
|Use SSL | UseSsl | "Security Configuration" tab |

### WTCServer / WTCPassword
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Passwords => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Local Access Point | LocalAccessPoint |  |
|Local Password | LocalPassword |  |
|Local Password Initialization Vector | LocalPasswordIV |  |
|Notes | Notes |  |
|Remote Access Point | RemoteAccessPoint |  |
|Remote Password | RemotePassword |  |
|Remote Password Initialization Vector | RemotePasswordIV |  |

### WTCServer / WTCRemoteTuxDom
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Remote Tuxedo Domains => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Access Point | AccessPoint | "General" tab |
|Access Point ID | AccessPointId | "General" tab |
|ACL Policy | AclPolicy | "Security Configuration" tab |
|Allow Anonymous | AllowAnonymous | "Security Configuration" tab |
|App Key Generator Plug-in Type | AppKey | "Security Configuration" tab |
|Compression Limit | CmpLimit | "Connection Properties" tab |
|Connection Principal Name | ConnPrincipalName | "Connection Properties" tab |
|Connection Policy | ConnectionPolicy | "Connection Properties" tab |
|Credential Policy | CredentialPolicy | "Security Configuration" tab |
|Custom App Key Class | CustomAppKeyClass | "Security Configuration" tab |
|Custom App Key Class Param | CustomAppKeyClassParam | "Security Configuration" tab |
|Default App Key | DefaultAppKey | "Security Configuration" tab |
|Federation Name | FederationName | "General" tab |
|Federation URL | FederationURL | "General" tab |
|Keep Alive | KeepAlive | "Connection Properties" tab |
|Keep Alive Wait | KeepAliveWait | "Connection Properties" tab |
|Local Access Point | LocalAccessPoint | "General" tab |
|Max Encrypt Bits | MaxEncryptBits | "Security Configuration" tab |
|Max Retries | MaxRetries | "Connection Properties" tab |
|Min Encrypt Bits | MinEncryptBits | "Security Configuration" tab |
|Network Address | NWAddr | "General" tab |
|Notes | Notes | "General" tab |
|Retry Interval | RetryInterval | "Connection Properties" tab |
|TPUSR File Name | TpUsrFile | "Security Configuration" tab |
|SSL Protocol Version | SslProtocolVersion | "Security Configuration" tab |
|Tuxedo Group ID Keyword | TuxedoGidKw | "Security Configuration" tab |
|Tuxedo User ID Keyword | TuxedoUidKw | "Security Configuration" tab |

### WTCServer / WTCResources
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Resources

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|App Password | AppPassword |  |
|App Password Initialization Vector | AppPasswordIv |  |
|FMW Field Table 16-bit Classes | FldTbl16Class |  |
|FMW Field Table 32-bit Classes | FldTbl32Class |  |
|MB Encoding Map File | MBEncodingMapFile |  |
|Notes | Notes |  |
|Remote MB Encoding | RemoteMBEncoding |  |
|TPUSR File Name | TpUsrFile |  |
|View Table 16-bit Classes | ViewTbl16Class |  |
|View Table 32-bit Classes | ViewTbl32Class |  |

### WTCServer / WTCtBridgeGlobal
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Tuxedo Queuing Bridge

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allow Non-Standard Types | AllowNonStandardTypes | "General" tab |
|Default Reply Delivery Mode | DefaultReplyDeliveryMode | "General" tab |
|Delivery Mode Override | DeliveryModeOverride | "General" tab |
|JMS Connection Factory Class Name | JmsFactory | "Connection Factories" tab |
|JMS To Tuxedo Priority Map | JmsToTuxPriorityMap | "Priority Mapping" tab |
|JNDI Initial Context Factory Class Name | JndiFactory | "Connection Factories" tab |
|Notes | Notes | "General" tab |
|Retries | Retries | "Error Handling" tab |
|Retry Delay | RetryDelay | "Error Handling" tab |
|Timeout | Timeout | "Error Handling" tab |
|Transactional | Transactional | "General" tab |
|Tuxedo Error Queue | TuxErrorQueue | "General" tab |
|Tuxedo Connection Factory Class Name | TuxFactory | "Connection Factories" tab |
|Tuxedo To JMS Priority Map | TuxToJmsPriorityMap | "Priority Mapping" tab |
|User ID | UserId | "General" tab |
|WLS Error Destination | WlsErrorDestination | "General" tab |

### WTCServer / WTCtBridgeRedirect
Navigate to: Resources => WebLogic Tuxedo Connector Servers => (instance) => Tuxedo Queuing Redirects => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Direction | Direction |  |
|Metadata File | MetaDataFile |  |
|Notes | Notes |  |
|Reply Q | ReplyQ |  |
|Source Access Point | SourceAccessPoint |  |
|Source Name | SourceName |  |
|Source Qspace | SourceQspace |  |
|Target Access Point | TargetAccessPoint |  |
|Target Name | TargetName |  |
|Target Qspace | TargetQspace |  |
|Translate FML | TranslateFML |  |

### WebAppContainer
Navigate to: Resources => Web App Container

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Allow All Roles | AllowAllRoles |  |
|Authentication Cookie Enabled | AuthCookieEnabled |  |
|Change Session ID On Authentication | ChangeSessionIDOnAuthentication |  |
|Client Certificate Proxy Enabled | ClientCertProxyEnabled |  |
|Filter Dispatched Requests Enabled | FilterDispatchedRequestsEnabled |  |
|Form Authentication X-Frame-Options Header Value | FormAuthXFrameOptionsHeaderValue |  |
|HTTP Trace Support Enabled | HttpTraceSupportEnabled |  |
|JSP Compiler Backwards Compatible | JSPCompilerBackwardsCompatible |  |
|JAX-RS Monitoring Default Behavior | JaxRsMonitoringDefaultBehavior |  |
|Max Post Size | MaxPostSize |  |
|Max Post Time Secs | MaxPostTimeSecs |  |
|Max Request Parameter Count | MaxRequestParameterCount |  |
|Max Single Header Size | MaxSingleHeaderSize |  |
|Max Total Headers Size | MaxTotalHeadersSize |  |
|Mime Mapping File | MimeMappingFile |  |
|Notes | Notes |  |
|Optimistic Serialization | OptimisticSerialization |  |
|Overload Protection Enabled | OverloadProtectionEnabled |  |
|P3P Header Value | P3PHeaderValue |  |
|Post Timeout Seconds | PostTimeoutSecs |  |
|Reject Malicious Path Parameters | RejectMaliciousPathParameters |  |
|Re-Login Enabled | ReloginEnabled |  |
|Restrict User Management Access Patterns | RestrictUserManagementAccessPattern |  |
|Retain Original URL | RetainOriginalURL |  |
|Error on JSP Param Name with Request Time Value | RtexprvalueJspParamName |  |
|SameSite Filter Cookie Settings | SameSiteFilterCookieSetting |  |
|SameSite Filter Secure Channel Required | SameSiteFilterSecureChannelRequired |  |
|SameSite Filter User Agent Regular Expressions | SameSiteFilterUserAgentRegEx |  |
|Servlet Authentication Form URL | ServletAuthenticationFormURL |  |
|Servlet Reload Check Seconds | ServletReloadCheckSecs |  |
|Show Archived Real Path Enabled | ShowArchivedRealPathEnabled |  |
|Synchronized Session Timeout Enabled | SynchronizedSessionTimeoutEnabled |  |
|WAP Enabled | WAPEnabled |  |
|WebLogic Plug-in Enabled | WeblogicPluginEnabled |  |
|Work Context Propagation Enabled | WorkContextPropagationEnabled |  |
|X-Powered-By Header Level | XPoweredByHeaderLevel |  |

### WebAppContainer / GzipCompression
Navigate to: Resources => Web App Container => GZIP Compression

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|GZIP Compression Content Types | GzipCompressionContentType |  |
|GZIP Compression Enabled | GzipCompressionEnabled |  |
|GZIP Compression Min Content Length | GzipCompressionMinContentLength |  |
|Notes | Notes |  |

### WebAppContainer / Http2Config
Navigate to: Resources => Web App Container => HTTP/2 Configuration

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Continuation Frames Limit | ContinuationFramesLimit |  |
|Frame Count Limit Reset Interval | FrameCountLimitResetInterval |  |
|Header Table Size | HeaderTableSize |  |
|Initial Window Size | InitialWindowSize |  |
|Max Concurrent Streams | MaxConcurrentStreams |  |
|Max Frame Size | MaxFrameSize |  |
|Max Header List Size | MaxHeaderListSize |  |
|Max Stream Resets | MaxStreamResets |  |
|Notes | Notes |  |

### WebserviceSecurity
Navigate to: Topology => Webservice Securities => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Compatibility Ordering Preference | CompatibilityOrderingPreference |  |
|Compatibility Preference | CompatibilityPreference |  |
|Default WS-Trust Credential Provider STS URL | DefaultCredentialProviderStsuri |  |
|Notes | Notes |  |
|Policy Selection Preference | PolicySelectionPreference |  |

### WebserviceSecurity / WebserviceCredentialProvider
Navigate to: Topology => Webservice Securities => (instance) => Webservice Credential Providers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class Name | ClassName |  |
|Notes | Notes |  |
|Token Type | TokenType |  |

### WebserviceSecurity / WebserviceCredentialProvider / ConfigurationProperty
Navigate to: Topology => Webservice Securities => (instance) => Webservice Credential Providers => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### WebserviceSecurity / WebserviceSecurityToken
Navigate to: Topology => Webservice Securities => (instance) => Webservice Security Tokens => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class Name | ClassName |  |
|Notes | Notes |  |
|Token Type | TokenType |  |

### WebserviceSecurity / WebserviceSecurityToken / ConfigurationProperty
Navigate to: Topology => Webservice Securities => (instance) => Webservice Security Tokens => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### WebserviceSecurity / WebserviceTimestamp
Navigate to: Topology => Webservice Securities => (instance) => Webservice Timestamp

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Clock Skew | ClockSkew |  |
|Clock Synchronized | ClockSynchronized |  |
|Max Processing Delay | MaxProcessingDelay |  |
|Notes | Notes |  |
|Validity Period | ValidityPeriod |  |

### WebserviceSecurity / WebserviceTokenHandler
Navigate to: Topology => Webservice Securities => (instance) => Webservice Token Handlers => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Class Name | ClassName |  |
|Handling Order | HandlingOrder |  |
|Notes | Notes |  |
|Token Type | TokenType |  |

### WebserviceSecurity / WebserviceTokenHandler / ConfigurationProperty
Navigate to: Topology => Webservice Securities => (instance) => Webservice Token Handlers => (instance) => Configuration Properties => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Encrypt Value Required | EncryptValueRequired |  |
|Notes | Notes |  |
|Value | Value |  |

### XMLEntityCache
Navigate to: Topology => XML Entity Caches => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cache Disk Size | CacheDiskSize |  |
|Cache Location | CacheLocation |  |
|Cache Memory Size | CacheMemorySize |  |
|Cache Timeout Interval | CacheTimeoutInterval |  |
|Max Size | MaxSize |  |
|Notes | Notes |  |

### XMLRegistry
Navigate to: Topology => XML Registries => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Document Builder Factory | DocumentBuilderFactory |  |
|Handle Entity Invalidation | HandleEntityInvalidation |  |
|Notes | Notes |  |
|SAX Parser Factory | SAXParserFactory |  |
|Schema Factory | SchemaFactory |  |
|Transformer Factory | TransformerFactory |  |
|When To Cache | WhenToCache |  |
|Xml Event Factory | XmlEventFactory |  |
|Xml Input Factory | XmlInputFactory |  |
|Xml Output Factory | XmlOutputFactory |  |
|Xpath Factory | XpathFactory |  |

### XMLRegistry / XMLEntitySpecRegistryEntry
Navigate to: Topology => XML Registries => (instance) => XML Entity Spec Registry Entries => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Cache Timeout Interval | CacheTimeoutInterval |  |
|Entity URI | EntityURI |  |
|Handle Entity Invalidation | HandleEntityInvalidation |  |
|Notes | Notes |  |
|Public ID | PublicId |  |
|System ID | SystemId |  |
|When To Cache | WhenToCache |  |

### XMLRegistry / XMLParserSelectRegistryEntry
Navigate to: Topology => XML Registries => (instance) => XML Parser Select Registry Entries => (instance)

| Attribute Name | Model Key | Location |
|------|----------|------------------|
|Document Builder Factory | DocumentBuilderFactory |  |
|Notes | Notes |  |
|Public ID | PublicId |  |
|Root Element Tag | RootElementTag |  |
|SAX Parser Factory | SAXParserFactory |  |
|System ID | SystemId |  |
|Transformer Factory | TransformerFactory |  |
