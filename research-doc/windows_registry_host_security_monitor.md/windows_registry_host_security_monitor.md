# Windows Registry-Based Host Security Monitor

## Project Proposal, Research Review, Features, Technology Stack, and Related Repositories

**Proposed title:** Windows Registry-Based Host Security Monitor:
Rule-Based Detection of Suspicious Configuration Changes\
**Project domain:** Cybersecurity, Host-Based Intrusion Detection,
Windows Endpoint Monitoring\
**Project type:** Mini-project / prototype

------------------------------------------------------------------------

## 1. Executive Summary

This project proposes a lightweight Windows host-security monitor that
watches selected Windows Registry locations associated with startup
behavior, services, and security-sensitive configuration. It records
relevant changes, evaluates events against explainable detection rules,
and presents alerts in a dashboard.

The central research idea is that the Windows Registry is a useful
source of host-level security telemetry. Malware and unwanted software
may alter Registry values to establish persistence or change system
configuration. Monitoring such activity can therefore complement
network-based intrusion detection.

The proposed first version will use **rule-based detection**, rather
than attempting to reproduce the machine-learning methods in earlier
research papers. This makes the prototype easier to implement, explain,
test, and demonstrate. An optional future version could add
baseline-based anomaly detection.

> **Scope recommendation:** Keep Registry monitoring as the core of the
> project. Add process attribution as a supporting capability. Treat
> network-connection correlation as an optional extension, so the
> project remains distinct from a network-anomaly detection system.

## 2. Problem Statement

Network intrusion detection focuses on traffic flowing between systems,
but suspicious activity can also be visible in changes to an endpoint's
configuration. The Windows Registry stores configuration information
used by Windows and installed applications. Certain locations are
associated with startup execution, services, and security settings.

A lightweight monitoring tool could help identify potentially suspicious
changes by recording what changed, when it changed, and---where Windows
telemetry makes it available---which process performed the operation.
The challenge is to distinguish security-relevant activity from
legitimate changes made by software installers, updates, and
administrators.

The project will address this challenge through selected Registry
monitoring, rule-based detection, event logging, contextual evidence,
and an interface for reviewing alerts.

## 3. Goals and Objectives

-   Monitor selected Registry keys in near real time.
-   Detect additions, modifications, and deletions within the scope of
    the chosen monitoring mechanism.
-   Identify suspicious startup or configuration changes using explicit
    rules.
-   Correlate Registry events with process telemetry where available.
-   Store events and alerts for later review.
-   Explain why an event matched a rule.
-   Evaluate detection coverage, false positives, event latency, and
    resource usage.
-   Demonstrate the system safely using harmless changes in a test
    Windows environment.

## 4. Idea Description

The application will have a Windows-side monitoring component, a
detection engine, an event store, and a dashboard.

1.  **Collect:** Observe selected Registry locations and/or ingest
    Windows event telemetry.
2.  **Normalize:** Convert collected events into a consistent format
    containing timestamps, key paths, operation types, values where
    available, and process metadata where available.
3.  **Evaluate:** Apply security rules to identify potentially
    suspicious behavior.
4.  **Prioritize:** Assign a severity and record the rule that matched.
5.  **Explain:** Include the evidence and rationale for each alert.
6.  **Review:** Present events and alerts in a dashboard with search,
    filters, and history.

The prototype is intended to assist investigation. A Registry change is
not automatically malicious; alerts should be treated as signals for
review rather than definitive proof of compromise.

## 5. Research Review: Four Relevant Papers

The four papers below provide a useful progression: a Registry-specific
detection prototype, a second Registry-specific approach, a comparison
of anomaly-detection algorithms, and a broader survey of host-based
intrusion detection research.

### Paper 1 --- Detecting Malicious Software by Monitoring Anomalous Windows Registry Accesses (2002)

**Authors:** Frank Apap, Andrew Honig, Shlomo Hershkop, Eleazar Eskin,
and Salvatore J. Stolfo\
**Venue:** Fifth International Symposium on Recent Advances in Intrusion
Detection (RAID 2002), pp. 36--53\
**DOI:**
[10.1007/3-540-36084-0_3](https://doi.org/10.1007/3-540-36084-0_3)\
**Paper PDF:** [Columbia University
PDF](https://www.cs.columbia.edu/~sh553/papers/drafts/rad-dist02.pdf)

#### Research problem

The authors investigate whether Registry activity can be used as a
signal for detecting malicious software on Windows hosts. Instead of
relying only on network traffic or known malware signatures, the
approach observes Registry accesses and asks whether they differ from a
host's normal behavior.

#### Core method

The system first learns a model of normal Registry behavior from data
collected without attacks. At run time, new Registry accesses are
compared against this learned model. An access judged abnormal can be
flagged as potentially associated with malicious activity.

This is an **anomaly-based** approach: it attempts to learn expected
behavior rather than relying exclusively on a fixed list of suspicious
Registry paths.

#### Main contribution

The paper demonstrates a host-based intrusion detection direction in
which Registry behavior itself is treated as a useful security signal.
It helps establish the conceptual foundation for Registry monitoring as
a complement to other detection sources.

#### Strengths

-   Uses host-level behavior rather than depending solely on network
    observations.
-   Can potentially identify behavior that does not match previously
    specified signatures.
-   Establishes a concrete way to study Registry activity for intrusion
    detection.

#### Limitations and considerations

-   Anomaly detection depends on the quality and representativeness of
    the normal-behavior training data.
-   Legitimate software updates and configuration changes may differ
    from the learned baseline and generate false positives.
-   A learned anomaly does not, by itself, prove that an action is
    malicious.
-   Reproducing the original experimental setup is more demanding than
    building a small rule-based prototype.

#### Connection to the proposed project

Use this paper to justify the Registry as a valuable host-security
telemetry source. The prototype will deliberately start with explicit
rules, such as flagging a new startup entry that points to an unusual
writable directory. This gives clear, explainable results without
requiring a training dataset. A baseline/anomaly module could be
considered later.

**Key takeaway:** Registry activity can be security-relevant, but a
practical detector must decide how to represent normal behavior and
manage false alarms.

------------------------------------------------------------------------

### Paper 2 --- Host Based Intrusion Detection by Monitoring Windows Registry Accesses (2004)

**Authors:** Murat Topallar, M. Ozgur Depren, Emin Anarım, and K. Ciliz\
**Venue:** Proceedings of IEEE SIU 2004, 12th National Conference on
Signal Processing and Applications, pp. 728--731\
**DOI:**
[10.1109/SIU.2004.1338634](https://doi.org/10.1109/SIU.2004.1338634)\
**Research record:** [ResearchGate publication
page](https://www.researchgate.net/publication/220860849_Host_Based_Intrusion_Detection_by_Monitoring_Windows_Registry_Accesses)

#### Research problem

This paper also investigates host-based intrusion detection through
Windows Registry behavior. Its premise is that malicious activity can
produce Registry access patterns that differ from those observed during
normal operation.

#### Core method

The authors describe training a model using Registry activity that does
not contain attacks, then checking later accesses for abnormal behavior.
The approach uses a **Self-Organizing Map (SOM)**, a type of artificial
neural network, to model normal Registry behavior and identify
deviations.

#### Main contribution

The work offers another example of Registry-focused anomaly detection,
using a neural-network-based method rather than a purely rule-based
system. The paper reports that the method can detect malicious behavior
with a low false-alarm rate in its evaluated setting. That result should
be understood in the context of the authors' experimental data and
setup, not as a guarantee for modern Windows systems.

#### Strengths

-   Focuses directly on Windows Registry behavior.
-   Illustrates how an unsupervised or self-organizing model can
    represent normal activity.
-   Provides a useful contrast with explicit, manually authored
    detection rules.

#### Limitations and considerations

-   The detector needs representative benign Registry data for training.
-   Behavior that was normal in the training environment may not
    represent a different machine or a later software environment.
-   The reported performance may not transfer directly to a modern
    Windows version or a different workload.
-   A model may flag a deviation without providing the straightforward
    explanation a security analyst expects from a rule.

#### Connection to the proposed project

This paper supports the project's overall technical direction, but the
proposed system will use deterministic rules first. For example, it
could flag a newly created startup value, record its target path, and
explain the rule that matched. SOM-based detection could be a future
experiment if the team has enough time and suitable data.

**Key takeaway:** Registry-based detection can be implemented with
learned behavioral models, but the complexity of training and
interpreting a model must be weighed against the benefits.

------------------------------------------------------------------------

### Paper 3 --- A Comparative Evaluation of Two Algorithms for Windows Registry Anomaly Detection (2005)

**Authors:** Salvatore J. Stolfo, Frank Apap, Eleazar Eskin, Katherine
Heller, Shlomo Hershkop, Andrew Honig, and Krysta M. Svore\
**Journal:** *Journal of Computer Security*, 13(4), pp. 659--693, 2005\
**DOI:**
[10.3233/JCS-2005-13403](https://doi.org/10.3233/JCS-2005-13403)\
**Publisher page:** [Microsoft Research publication
record](https://www.microsoft.com/en-us/research/publication/a-comparative-evaluation-of-two-algorithms-for-windows-registry-anomaly-detection/)

#### Research problem

A detection system may be able to identify abnormal Registry activity,
but its practical value also depends on the algorithm's accuracy,
computational cost, and false-alarm behavior. This paper compares two
learning-based approaches for detecting abnormal Windows Registry
accesses.

#### Core methods compared

The paper compares:

-   **PAD (Probabilistic Anomaly Detection):** estimates probability
    distributions for Registry behavior and treats sufficiently unlikely
    activity as anomalous.
-   **Support Vector Machine (SVM):** uses an SVM-based model to
    distinguish normal from abnormal Registry behavior under the
    evaluated configurations.

Both approaches first learn normal Registry behavior from training data.
At run time, Registry accesses are assessed against the learned model.

#### Findings reported by the authors

The authors report that both algorithms can detect malicious software
activity in their experiments while maintaining a low rate of false
alarms. In their comparison, PAD performs better than the evaluated SVM
implementations in both accuracy and computational complexity across the
tested kernel functions.

This is a result from the study's evaluation---not a universal claim
that probabilistic methods always outperform SVMs.

#### Why the comparison matters

This paper is useful because it treats detection quality and operational
cost as part of the problem. A detector that flags every unfamiliar
change may have high coverage but be too noisy to use. A computationally
expensive detector may also be unsuitable for continuous endpoint
monitoring.

#### Connection to the proposed project

The first prototype will not implement PAD or SVM. Instead, this paper
can inform the project's evaluation methodology. The team should
measure:

-   True positives on a defined set of controlled suspicious test cases.
-   False positives from legitimate Registry changes.
-   Detection latency from a change to an alert.
-   CPU and memory overhead during monitoring.
-   Rule-by-rule performance and the reasons for missed detections.

If a later version adds machine learning, the paper provides two
historical approaches that could be compared against the rule engine.

**Key takeaway:** Detection accuracy alone is not enough; computational
cost and false positives also determine whether a host monitor is
useful.

------------------------------------------------------------------------

### Paper 4 --- A Survey of Intrusion Detection Systems Leveraging Host Data (2019)

**Authors:** Robert A. Bridges, Tarrah R. Glass-Vanderlan, Michael D.
Iannacone, Maria S. Vincent, and Qian Chen\
**Journal:** *ACM Computing Surveys*, 52(6), 2019\
**DOI:** [10.1145/3344382](https://doi.org/10.1145/3344382)\
**Free preprint:** [arXiv:1805.06070](https://arxiv.org/abs/1805.06070)\
**Institutional publication page:** [Oak Ridge National
Laboratory](https://www.ornl.gov/publication/survey-intrusion-detection-systems-leveraging-host-data)

#### Research problem

Host-based intrusion detection covers many kinds of data, algorithms,
and attack scenarios. This survey organizes the research landscape to
help researchers understand which host data sources have been used, what
approaches have been studied, and which datasets are available for
evaluation.

#### Scope and organization

The survey reviews host-based intrusion detection work using sources
including:

-   System and application logs.
-   Audit data and system-call activity.
-   Windows Registry activity.
-   File-system activity.
-   Program analysis.
-   Datasets used to develop and evaluate host-based detectors.

It also discusses algorithmic techniques relevant to host detection and
highlights challenges with the available datasets.

#### Main contribution

Rather than proposing one Registry detection algorithm, the paper
provides a broader framework for understanding host-based intrusion
detection. It is especially useful for deciding what telemetry to
collect and how to evaluate a prototype responsibly.

#### Relevance to project design

The survey supports several design choices:

1.  **Use multiple contextual fields when available.** A Registry path
    alone may not be enough; process identity, timestamp, operation
    type, and surrounding events can improve interpretation.
2.  **Document the source and limitations of each event.** Different
    collection mechanisms expose different fields and levels of detail.
3.  **Evaluate with an explicit methodology.** State what events were
    tested, what counted as a detection, and what counted as a false
    positive.
4.  **Do not assume datasets are interchangeable.** Results depend on
    the data source, collection environment, attack coverage, and
    labels.
5.  **Keep claims proportional to evidence.** A prototype tested with
    controlled Registry changes demonstrates a functioning monitor, but
    does not establish production-grade malware detection.

#### Connection to the proposed project

This is the strongest source for the literature-review overview and
evaluation section. It can help frame the project as a focused
host-based detection prototype rather than a complete endpoint security
product.

**Key takeaway:** Host-based detection is a broad field; a credible
project must explain its telemetry, detection method, dataset or test
setup, and evaluation limitations.

------------------------------------------------------------------------

## 6. Cross-Paper Comparison

  -----------------------------------------------------------------------
  Paper             Data / focus      Detection method  Main value for
                                                        this project
  ----------------- ----------------- ----------------- -----------------
  Apap et           Windows Registry  Learned normal    Justifies
  al. (2002)        accesses          behavior; anomaly Registry activity
                                      detection         as a security
                                                        signal

  Topallar et       Windows Registry  Self-Organizing   Provides a
  al. (2004)        accesses          Map               contrasting
                                                        neural-network
                                                        approach

  Stolfo et         Windows Registry  PAD vs. SVM       Shows the
  al. (2005)        accesses                            importance of
                                                        accuracy, false
                                                        alarms, and
                                                        computational
                                                        cost

  Bridges et        Multiple host     Survey of methods Informs telemetry
  al. (2019)        data sources      and datasets      selection and
                                                        evaluation
                                                        methodology
  -----------------------------------------------------------------------

### Synthesis of the literature

The first three papers share the idea that malicious behavior can be
detected by identifying abnormal Registry activity. They primarily
explore **anomaly-based approaches**, which learn or model expected
behavior and then detect deviations. These methods can potentially
discover previously unspecified behavior, but depend on representative
training data and can generate false positives when normal software
behavior changes.

The proposed mini-project takes a different implementation path: it
begins with **rule-based detection**. Rules are easier to explain and
test in a limited project, but they only detect the behaviors their
authors have anticipated. This is an engineering trade-off, not a claim
that rules are inherently superior to anomaly detection.

The survey paper broadens the discussion by showing that Registry data
is one of several host telemetry sources and that evaluation depends on
the quality and limitations of the data. Together, the papers support a
prototype that collects clearly defined Registry events, explains each
rule match, and measures detection performance rather than claiming to
detect every form of malware.

### Research gap and proposed contribution

The papers establish that Registry monitoring and anomaly detection have
been studied for years. Therefore, the project should **not** claim that
Registry-based intrusion detection itself is novel.

A more defensible mini-project contribution is to build and evaluate a
small, explainable, modern Windows prototype that combines:

-   Monitoring of selected security-sensitive Registry locations.
-   Explicit rules for a documented set of suspicious configuration
    patterns.
-   Process attribution through a separate event-telemetry source where
    available.
-   A dashboard that preserves evidence and explains alerts.
-   A reproducible, controlled test plan with detection and
    false-positive measurements.

The contribution is the integration, usability, explainability, and
evaluation of the prototype---not the invention of Registry monitoring.

## 7. Features and Implementation Priorities

### Phase 1 --- Essential

-   **Registry watcher:** Observe selected keys and detect relevant
    changes.
-   **Sensitive-location configuration:** Define which paths are
    monitored.
-   **Rule engine:** Apply clear, testable rules to collected events.
-   **Event log:** Persist timestamps, paths, operation types, and
    available values.
-   **Alert manager:** Assign severity and explain the matching rule.
-   **Dashboard:** View, search, filter, and inspect events and alerts.
-   **Controlled test:** Add or modify a harmless test value and verify
    that the pipeline works.

### Phase 2 --- Recommended

-   **Process attribution:** Correlate Registry activity with Windows
    event telemetry or Sysmon.
-   **Baseline comparison:** Compare current values against an initial
    snapshot.
-   **Rule configuration:** Enable, disable, and tune rules.
-   **Noise reduction:** Group repeated events and suppress duplicates
    carefully.
-   **Evidence view:** Display the affected path, observed operation,
    process metadata if available, and rule rationale.
-   **Export:** Produce CSV or JSON investigation reports.

### Phase 3 --- Optional

-   **Process inventory:** Show running processes and executable paths.
-   **Network connection correlation:** Associate process information
    with network connections.
-   **MITRE ATT&CK mapping:** Map relevant rules to techniques such as
    Registry Run Keys/Startup Folder persistence.
-   **Timeline:** Correlate related changes over time.
-   **Anomaly detection:** Experiment with a learned baseline after
    collecting suitable data.

### Example Registry monitoring targets

  ------------------------------------------------------------------------------------------
  Location                                               Reason for monitoring
  ------------------------------------------------------ -----------------------------------
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`   Per-user startup entries

  `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`   Machine-wide startup entries

  Relevant `RunOnce` locations                           One-time startup/logon execution

  `HKLM\SYSTEM\CurrentControlSet\Services`               Service configuration changes

  Selected `Image File Execution Options` paths          Execution/debugger-related
                                                         configuration that can be abused

  Selected Windows security configuration keys           Potential security-setting
                                                         tampering
  ------------------------------------------------------------------------------------------

These locations are not malicious by themselves. Installers, updates,
and administrators legitimately change them. A rule should evaluate the
observed change and its context, not merely the fact that a key changed.

## 8. Technical Implementation Notes

A key design distinction is that **watching for Registry changes and
attributing a change to a process are separate tasks**.

-   Python's `winreg` module can read Registry keys and values.
-   The Windows API `RegNotifyChangeKeyValue` can notify a program that
    a selected key has changed. A notification alone is not a complete
    audit record of every value change or the process that caused it.
-   Microsoft Sysmon can log Registry-related events. Its event IDs
    include 12 (key/object creation and deletion), 13 (Registry value
    set), and 14 (key/value rename). The fields available depend on the
    event and configuration.
-   Windows Security auditing may provide additional process and
    Registry information when the relevant auditing and access settings
    are configured.
-   Correlation between a Registry event and process telemetry should be
    implemented carefully; do not claim reliable attribution when the
    source event does not provide it.

Official references:

-   [Microsoft documentation:
    RegNotifyChangeKeyValue](https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regnotifychangekeyvalue)
-   [Microsoft
    Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
-   [Microsoft Sysmon event
    reference](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon#events)
-   [FastAPI documentation](https://fastapi.tiangolo.com/)

## 9. Recommended Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Core language           Python 3.11+            Monitoring logic and
                                                  event processing

  Registry access         `winreg`                Read Registry values
                                                  and inspect keys

  Change notifications    Win32 API via `ctypes`  Observe selected
                          or a suitable wrapper   Registry changes

  Process telemetry       Sysmon and/or Windows   Obtain process-related
                          Security auditing       event details

  Detection               Python rules with YAML  Explainable event
                          configuration           classification

  Backend API             FastAPI                 Serve events and alerts
                                                  to the UI

  Storage                 SQLite                  Persist events, alerts,
                                                  and configuration

  Frontend                React + TypeScript +    Dashboard
                          Vite                    

  UI                      Tailwind CSS +          Interface components
                          shadcn/ui               

  Charts                  Recharts                Event and alert
                                                  summaries

  Tests                   `pytest`                Unit and integration
                                                  tests

  Packaging               PyInstaller (optional)  Package the Python
                                                  component for Windows
  -----------------------------------------------------------------------

### Suggested architecture

``` text
Windows Registry / Sysmon / Windows audit logs
                    |
                    v
          Event collection layer
                    |
                    v
            Event normalization
                    |
                    v
             Rule evaluation
                    |
          +---------+---------+
          |                   |
          v                   v
     SQLite storage      Alert manager
          |                   |
          +---------+---------+
                    |
                    v
               FastAPI
                    |
                    v
         React + TypeScript UI
```

The Registry watcher should run on Windows. A dashboard can be developed
separately, but the complete integration must be tested on a Windows
machine or virtual machine with the required permissions and event
sources configured.

## 10. Similar Projects and Repositories

These projects are references for different parts of the implementation;
they should not all be described as equivalent complete applications.

1.  **Windows Registry Monitor** ---
    [GihanShavinda/Windows-Registry-Monitor](https://github.com/GihanShavinda/Windows-Registry-Monitor)\
    A direct Registry-monitoring reference. Inspect its watcher,
    snapshot comparison, rule logic, and logging approach before
    deciding whether to reuse or independently implement similar
    functionality. Verify the current repository contents and license
    before adopting code.

2.  **Microsoft Sysmon** --- [Microsoft Sysmon
    documentation](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)\
    A Windows system-monitoring utility, not a full dashboard
    application. Useful as an event source for Registry changes and
    process context.

3.  **Sysmon Community Guide** ---
    [trustedsec/SysmonCommunityGuide](https://github.com/trustedsec/SysmonCommunityGuide)\
    Practical guidance for Sysmon event collection and configuration.

4.  **Sigma detection rules** ---
    [SigmaHQ/sigma](https://github.com/SigmaHQ/sigma)\
    A large collection of generic detection rules, including Windows
    rules. Useful for learning rule structure, severity conventions,
    event fields, and false-positive tuning.

5.  **Sysmon configuration examples** ---
    [Starke427/Sysmon](https://github.com/Starke427/Sysmon)\
    An example repository for Sysmon configuration. Review its current
    contents and maintenance status before using it.

Before adapting code or configuration, verify repository activity,
compatibility, dependencies, and license terms. A reference repository
is not evidence that the proposed end-to-end system is already
implemented.

## 11. Evaluation Plan

A useful project report should define its tests and metrics rather than
simply showing that one alert appears.

### Test scenarios

-   Add a harmless test value under a monitored startup-related Registry
    key.
-   Modify the test value and verify the event is recorded.
-   Remove the test value and verify deletion is detected, where the
    collection method supports it.
-   Perform a legitimate change and check whether the rule generates an
    inappropriate alert.
-   Generate repeated changes and evaluate duplicate handling.
-   Where Sysmon or audit telemetry is configured, verify whether
    process attribution is available and correctly correlated.

Use a disposable Windows virtual machine or another controlled test
environment. Avoid running malware or changing critical system security
settings for a classroom demonstration.

### Metrics

-   **Detection rate:** Number of defined test events detected divided
    by the total number of relevant test events.
-   **False-positive count/rate:** Legitimate test changes incorrectly
    flagged.
-   **Detection latency:** Time between the observed change and the
    displayed alert.
-   **Resource usage:** CPU and memory consumption while monitoring.
-   **Attribution coverage:** Fraction of relevant events for which the
    responsible process could be identified from available telemetry.
-   **Audit completeness:** Fraction of expected test operations that
    were recorded.

Be explicit that these measurements apply to the test scenarios used;
they do not establish universal malware-detection accuracy.

## 12. Demonstration Workflow

1.  Start the monitor and show the selected Registry paths.
2.  Make a harmless, controlled test change in a monitored location.
3.  Show the captured operation, timestamp, and available before/after
    information.
4.  Demonstrate the rule match and its explanation.
5.  Display the resulting alert in the dashboard.
6.  Open the event history and export a report.
7.  Remove the test value if appropriate and verify the resulting event.

## 13. Suggested Final Scope

For a manageable mini-project, implement the following:

-   A Windows Registry watcher.
-   Monitoring for additions, modifications, and deletions within
    selected keys.
-   At least five documented, testable detection rules.
-   Event and alert persistence using SQLite.
-   A React dashboard with severity, filters, history, and explanations.
-   Process attribution through Sysmon or Windows audit telemetry where
    available.
-   A controlled test plan reporting detection rate, false positives,
    latency, and resource usage.

Defer network connection correlation and machine-learning anomaly
detection until the core pipeline works reliably.

## 14. Conclusion

The literature shows that Windows Registry activity has long been
studied as a source of host-based intrusion-detection evidence. Early
work explored learned models of normal Registry behavior, including
probabilistic methods, SVMs, and Self-Organizing Maps. A broader
host-data survey emphasizes the importance of telemetry choice,
evaluation data, and methodological limitations.

This project can turn those research ideas into an explainable and
demonstrable prototype by combining selected Registry monitoring,
explicit rules, process context where available, persistent logs, and a
dashboard. Its defensible contribution is a clearly scoped
implementation and evaluation---not a claim that Registry monitoring or
Registry-based intrusion detection is itself new.

------------------------------------------------------------------------

## References

1.  Apap, F., Honig, A., Hershkop, S., Eskin, E., & Stolfo, S. J.
    (2002). *Detecting Malicious Software by Monitoring Anomalous
    Windows Registry Accesses*. RAID 2002, 36--53.
    https://doi.org/10.1007/3-540-36084-0_3
2.  Topallar, M., Depren, M. O., Anarım, E., & Ciliz, K. (2004). *Host
    Based Intrusion Detection by Monitoring Windows Registry Accesses*.
    IEEE SIU 2004, 728--731. https://doi.org/10.1109/SIU.2004.1338634
3.  Stolfo, S. J., Apap, F., Eskin, E., Heller, K., Hershkop, S., Honig,
    A., & Svore, K. M. (2005). *A Comparative Evaluation of Two
    Algorithms for Windows Registry Anomaly Detection*. Journal of
    Computer Security, 13(4), 659--693.
    https://doi.org/10.3233/JCS-2005-13403
4.  Bridges, R. A., Glass-Vanderlan, T. R., Iannacone, M. D.,
    Vincent, M. S., & Chen, Q. (2019). *A Survey of Intrusion Detection
    Systems Leveraging Host Data*. ACM Computing Surveys, 52(6).
    https://doi.org/10.1145/3344382
