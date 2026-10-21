import { ArchitectureEdge, ArchitectureGraph, ArchitectureNode, ManifestData, ProjectFile } from '../types';

export function buildArchitectureGraph(files: ProjectFile[], manifest?: ManifestData): ArchitectureGraph {
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];
  const driftFindings: string[] = [];

  const nodeMap = new Map<string, ArchitectureNode>();

  const registerNode = (node: ArchitectureNode) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
      nodes.push(node);
    }
  };

  // 1. Module Nodes
  const modules = new Set<string>();
  files.forEach((f) => {
    const parts = f.path.split('/');
    if (parts.length > 2 && (parts[0] === 'app' || parts[0] === 'core' || parts[0] === 'feature' || parts[0] === 'domain' || parts[0] === 'data')) {
      modules.add(parts[0]);
    }
  });

  if (modules.size === 0) {
    modules.add('app');
  }

  modules.forEach((mod) => {
    registerNode({
      id: `mod_${mod}`,
      label: `Module :${mod}`,
      type: 'MODULE',
      module: mod,
    });
  });

  // 2. Android Manifest Components
  if (manifest) {
    manifest.activities.forEach((act) => {
      const actId = `act_${act.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: actId,
        label: act.name.split('.').pop() || act.name,
        type: 'ACTIVITY',
        filePath: 'AndroidManifest.xml',
        module: 'app',
        details: { exported: act.exported, isLauncher: act.isLauncher },
      });
      edges.push({
        id: `edge_${actId}_mod`,
        source: 'mod_app',
        target: actId,
        label: 'declares',
        confidence: 'CONFIRMED',
      });
    });

    manifest.services.forEach((srv) => {
      const srvId = `srv_${srv.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: srvId,
        label: srv.name.split('.').pop() || srv.name,
        type: 'SERVICE',
        filePath: 'AndroidManifest.xml',
        module: 'app',
        details: { exported: srv.exported },
      });
      edges.push({
        id: `edge_${srvId}_mod`,
        source: 'mod_app',
        target: srvId,
        label: 'registers',
        confidence: 'CONFIRMED',
      });
    });
  }

  // 3. Source File Component Scanning
  let hasRepository = false;
  let hasDatabase = false;
  let hasAiAgent = false;
  let hasNetworkClient = false;

  for (const file of files) {
    if (file.isBinary) continue;
    const content = file.content;
    const fileName = file.name;

    // AI Agent Discovery
    if (
      content.includes('GenerativeModel') ||
      content.includes('Gemini') ||
      content.includes('AiOrchestrator') ||
      content.includes('AgentRegistry') ||
      fileName.toLowerCase().includes('agent')
    ) {
      const agentId = `agent_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: agentId,
        label: fileName.replace('.kt', '').replace('.ts', ''),
        type: 'AI_AGENT',
        filePath: file.path,
        details: { provider: 'Gemini / NOVIN AI' },
      });
      hasAiAgent = true;
    }

    // Database / Room Entities
    if (content.includes('@Entity') || content.includes('@Dao') || content.includes('RoomDatabase') || content.includes('SQLiteOpenHelper')) {
      const dbId = `db_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: dbId,
        label: fileName.replace('.kt', ''),
        type: content.includes('@Entity') ? 'ENTITY' : 'DATABASE',
        filePath: file.path,
      });
      hasDatabase = true;
    }

    // Repository Pattern
    if (fileName.includes('Repository') || content.includes('interface ') && fileName.includes('Repo')) {
      const repoId = `repo_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: repoId,
        label: fileName.replace('.kt', '').replace('.ts', ''),
        type: 'REPOSITORY',
        filePath: file.path,
      });
      hasRepository = true;
    }

    // Network Clients
    if (content.includes('Retrofit') || content.includes('OkHttpClient') || content.includes('HttpClient(')) {
      const netId = `net_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      registerNode({
        id: netId,
        label: fileName.replace('.kt', '').replace('.ts', ''),
        type: 'NETWORK_CLIENT',
        filePath: file.path,
      });
      hasNetworkClient = true;
    }
  }

  // Connect inter-component relationships
  nodes.forEach((node) => {
    if (node.type === 'ACTIVITY') {
      // Check if Activity connects to ViewModels or Repositories
      const actFile = files.find((f) => f.name.includes(node.label));
      if (actFile) {
        nodes.forEach((targetNode) => {
          if (targetNode.id !== node.id && actFile.content.includes(targetNode.label)) {
            edges.push({
              id: `edge_${node.id}_${targetNode.id}`,
              source: node.id,
              target: targetNode.id,
              label: 'uses',
              confidence: 'STATICALLY_INFERRED',
            });

            // Architecture Drift Check: Activities directly calling Database without Repository
            if (targetNode.type === 'DATABASE' || targetNode.type === 'ENTITY') {
              driftFindings.push(
                `Architecture Drift: Activity '${node.label}' directly references persistence entity '${targetNode.label}' bypassing the Repository pattern.`
              );
            }
          }
        });
      }
    }

    if (node.type === 'REPOSITORY') {
      const repoFile = files.find((f) => f.name.includes(node.label));
      if (repoFile) {
        nodes.forEach((target) => {
          if ((target.type === 'DATABASE' || target.type === 'NETWORK_CLIENT') && repoFile.content.includes(target.label)) {
            edges.push({
              id: `edge_${node.id}_${target.id}`,
              source: node.id,
              target: target.id,
              label: 'queries',
              confidence: 'CONFIRMED',
            });
          }
        });
      }
    }
  });

  if (driftFindings.length === 0) {
    if (nodes.length > 3) {
      driftFindings.push('Architecture conforms to standard Android Clean Architecture with separation of UI, Domain, and Data layers.');
    } else {
      driftFindings.push('Minimal single-module architecture detected.');
    }
  }

  return { nodes, edges, driftFindings };
}
