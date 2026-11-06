---
title: Reversing <code style="color:grey">php2shell</code> for beginners
tags: [PHP, CVE, vulnerability]
author: Darshan Naik
---
<p align="center"> <img src="{{ 'images/php2shell/php2shell_banner.png' | relative_url }}" alt="php2 shell banner" width="1800" /> </p>

## Abstract

PHP2Shell is the collective name used for two critical PHP runtime vulnerabilities disclosed on 21 October 2026: CVE-2026-109618, involving improper handling of out-of-memory (OOM) errors while internal request data is only partially initialized, and CVE-2026-109619, involving worker-persistent state that may retain references to request-owned memory after that memory has been freed. The vulnerabilities demonstrate how error handling, object lifetime, request cleanup, and persistent worker reuse can combine to create a memory-safety failure with remote code-execution impact.

## History

The history is notable because the root-cause class was noticed before a concrete remote-code-execution path was established. The gap reflects the difficulty of reasoning about exceptional control flow in a large C runtime: code that appears to be a stability issue may become a security vulnerability when an attacker can reliably trigger the failure and influence the state later consumed by cleanup or a subsequent request.

`11 August 2026` 

> Calif researcher Ryan A reported an unconditional RCE with the same root cause as the earlier OOM issue; OpenAI independently reported the same root cause. Further vectors followed from Wiz and OpenAI.

`20 October 2026`

> PHP announced an upcoming critical release; public circulation of vulnerability identifiers affected the planned disclosure window, according to project reporting.

`21 October 2026`

> PHP released fixed versions 8.5.12, 8.4.27, 8.3.36, and 8.2.35 for CVE-2026-109618 and CVE-2026-109619.

`23 October 2026` 

> PHP published an informational advisory concerning CVE-2026-115560 and recommended temporarily disabling session upload progress until the next regular bug-fix release.

## PHP Request Lifecycle 

#### IMP Stage - 

<p align="center"> <img src="{{ 'images/php2shell/history.png' | relative_url }}" alt="php2 shell banner" width="1800" /> </p>


A web request may pass through a reverse proxy or web server, a PHP SAPI, PHP request startup, input parsing, application execution, request shutdown, and finally worker reuse or termination. PHP extensions can register module-level and request-level hooks: RINIT is request startup; RSHUTDOWN is request shutdown; MINIT/MSHUTDOWN describe module startup/shutdown. These hook points matter because worker lifetime can be longer than request lifetime.


#### Requsest Memory Versus Persistent State

PHP has a request-scoped memory manager. In extension code, `emalloc()`/`efree()` are commonly used for memory tied to a request, while persistent allocation uses different APIs and has a different lifetime. Request-bound allocations are released as part of request cleanup. A pointer stored in a structure that survives request shutdown must not continue to refer to an object in that request’s memory arena. 


| Concept |   Expected invariant   |     Failure mode when invariant breaks  |
| -------- | -------- | -------- |
| **Initialization** |    An object is fully initialized before any consumer assumes it is valid. | Cleanup observes fields that were never set or are inconsistent |
| **Ownership** |    Every pointer/reference has a well-defined owner and lifetime. | A caller keeps a pointer after the owning memory is released. |
| **Request reset** | Request-specific worker state is cleared or replaced before request memory is freed. | A later request can access stale data from the previous request. |
| **Error path** | Fatal/OOM exits preserve cleanup invariants or terminate without unsafe cleanup. | Non-local exit bypasses code that would normally initialize/reset state. |
| **Worker reuse** | Only process-persistent state remains accessible between requests. | Request A influences operations in Request B through dangling state. |

#### What happened with longjmp()

In C, `longjmp()` restores a saved execution context and transfers control non-locally. It does not behave like a normal return through every intervening stack frame. Any cleanup or invariant restoration that was expected to occur in those skipped frames must be handled through a design that explicitly accounts for the non-local exit. PHP’s OOM advisory describes a path where a failed allocation triggers this mechanism while request memory is temporarily reachable but not completely initialized. The problem is not simply `PHP ran out of memory`; it is that a fatal interruption can occur between two state transitions and leave later code with a false assumption about the state. 

#### SAPI differences 

The PHP advisory differentiates execution environments. The confirmed OOM RCE was validated over HTTP against Apache `mod_php`, where request shutdown can be invoked even if request startup has failed. The advisory identifies PHP-FPM as susceptible by source analysis in some post-startup OOM paths, but says the same complete exploit was not demonstrated there. FrankenPHP was described as likely susceptible to a similar application-independent path; 

## CVE-2026-109618 - Out-of-memory corruption 

The official advisory explains that PHP used `longjmp()` to leave the current context after an out-of-memory error and abort request handling. In some contexts, internal request data was reachable before it was fully initialized. If an allocation failed in that window, control could exit without the code properly accounting for the interrupted initialization.

<p align="center"> <img src="{{ 'images/php2shell/OOM_Concept.png' | relative_url }}" alt="php2 shell banner" width="1800" /> </p>

### How Attacker Controlled Input 

There are several ways multipart input can drive high allocation pressure even when a request appears to remain within an ordinary configured limit. These include cases where an absent or unusable declared content length affects the initial body-size check, a multipart part has many headers whose in-memory representation is more expensive than their wire representation, and empty file controls or nested field names cause extra metadata/array work.

## CVE-2026-109619 - Stale Worker State

*Core Defect*

The state such as error, session, object, or extension state that is retained by a worker but refers to memory owned by an individual request. This state must be reset before the request memory is released. A fatal error can interrupt a producer operation before it performs the matching reset; a warning or diagnostic during a later shutdown stage can also repopulate state after it was cleared. The next request can then reach a consumer operation before normal request initialization replaces the stale state.

<p align="center"> <img src="{{ 'images/php2shell/stale worker model.png' | relative_url }}" alt="php2 shell banner" width="1800" /> </p>

#### What was the condition 

It is confirmed PHP 8.5 fatal-error-backtrace case: 

with `fatal_error_backtraces` enabled, fatal error reporting can store backtrace state owned by the request, and the global reset is missed during shutdown. A diagnostic in a later request can consume that stale value before request initialization. The advisory also confirms a session upload-progress lifecycle case in which session/decoder state can be initialized before ordinary module initialization and then left stale after an OOM or other fatal error.

Configuration and SAPI detail matters. The advisory describes early INI diagnostics as a path for `mod_php` when directory configuration is applied before request startup. FPM exposure is conditional on front-end supplied `PHP_VALUE`/`PHP_ADMIN_VALUE` parameters that generate a diagnostic before initialization; the normal FPM pool configuration is applied at worker startup, while `.user.ini` is applied later. The advisory says an equivalent early configuration consumer was not established in default FrankenPHP, which is not the same as saying FrankenPHP is immune to all possible lifecycle paths

### Remediation Check 


<p align="center"> <img src="{{ 'images/php2shell/Remediation.png' | relative_url }}" alt="php2 shell banner" width="1800" /> </p>

```
# Apply patches or packages for CVE-2026-109618, CVE-2026-109619, and CVE-2026-109620.
# On Debian/Ubuntu (non-FPM example):
# sudo apt install php8.5-fpm=8.5.12-1+ubuntu24.04.1+deb.sury.org+1
# On RHEL/CentOS derivatives, package names vary by repo (Remi, EPEL, vendor).

# Verify PHP version and runtime:
php -v
php --ini

# For the specific OOM RCE, confirm the web SAPI and related settings.
# A safe baseline for investigation is:
php -r 'printf("PHP_VERSION=%s\nPHP_SAPI=%s\nZTS=%s\n", PHP_VERSION, PHP_SAPI, PHP_ZTS ? "yes" : "no");'

# Useful settings for OOM/input/session research:
php -r 'foreach (["memory_limit","post_max_size","max_input_vars","max_input_nesting_level","session.upload_progress.enabled","fatal_error_backtraces"] as $k) { printf("%s=%s\n", $k, ini_get($k)); }'

# List relevant running PHP processes on Linux (names and service units vary):
ps -eo pid,ppid,user,args | grep -E '[p]hp-fpm|[p]hp-cgi|[a]pache2|[h]ttpd'

```



## Verify after the patch 

```
# Identify the CLI runtime (useful, but not proof of the web runtime):
php -v
php --ini
php -r 'printf("PHP_VERSION=%s
PHP_SAPI=%s
ZTS=%s
", PHP_VERSION, PHP_SAPI, PHP_ZTS ? "yes" : "no");'

# Inspect useful configuration values for the CLI SAPI:
php -r 'foreach (["memory_limit", "post_max_size", "max_input_vars", "max_input_nesting_level", "session.upload_progress.enabled", "fatal_error_backtraces"] as $k) { printf("%s=%s
", $k, ini_get($k)); }'

# Check running web/PHP processes on Linux (names and service units vary):
ps -eo pid,ppid,user,args | grep -E '[p]hp-fpm|[p]hp-cgi|[a]pache2|[h]ttpd' 

```

The post-upgrade evidence record should contain the old and new package versions, vendor advisory, worker restart timestamp, process/binary identity, SAPI, active configuration, smoke-test results, and any accepted exception. If a product relies on a backport, preserve the vendor’s statement linking the package build to the CVE fix.

> For further you can check out the official guidelines by php at https://www.php.net/releases/8.5/en.php

Follow me on [X/Twitter](https://x.com/darshanhackz) and [Instagram](https://instagram.com/darshanhacks) for more updates and insights. 

Happy Hacking : ) 