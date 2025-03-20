
import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RouteInfo {
  title: string;
  path: string;
  isDynamic?: boolean;
  entityType?: 'tontine' | 'cycle' | 'payment' | 'member';
  getEntityName?: (id: string) => Promise<string>;
}

const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const [dynamicNames, setDynamicNames] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  // Define route structure with titles
  const routes: RouteInfo[] = [
    { title: 'Dashboard', path: '/dashboard' },
    { title: 'Tontines', path: '/tontines' },
    { 
      title: 'Tontine Details', 
      path: '/tontines/:id', 
      isDynamic: true,
      entityType: 'tontine',
      getEntityName: async (id: string) => {
        const { data } = await supabase
          .from('tontines')
          .select('name')
          .eq('id', id)
          .single();
        return data?.name || 'Tontine Details';
      }
    },
    { 
      title: 'Edit Tontine', 
      path: '/tontines/:id/edit', 
      isDynamic: true,
      entityType: 'tontine',
      getEntityName: async (id: string) => {
        const { data } = await supabase
          .from('tontines')
          .select('name')
          .eq('id', id)
          .single();
        return `Edit: ${data?.name || 'Tontine'}`;
      }
    },
    { title: 'Cycles', path: '/cycles' },
    { 
      title: 'Cycle Details', 
      path: '/cycles/:id', 
      isDynamic: true,
      entityType: 'cycle',
      getEntityName: async (id: string) => {
        const { data } = await supabase
          .from('cycles')
          .select('cycle_number, tontines(name)')
          .eq('id', id)
          .single();
        return data ? `Cycle #${data.cycle_number} - ${data.tontines?.name || 'Tontine'}` : 'Cycle Details';
      }
    },
    { 
      title: 'Edit Cycle', 
      path: '/cycles/:id/edit', 
      isDynamic: true,
      entityType: 'cycle',
      getEntityName: async (id: string) => {
        const { data } = await supabase
          .from('cycles')
          .select('cycle_number')
          .eq('id', id)
          .single();
        return `Edit Cycle #${data?.cycle_number || ''}`;
      }
    },
    { title: 'Payments', path: '/payments' },
    { title: 'Reports', path: '/reports' },
    { title: 'Profile', path: '/profile' },
    { title: 'Settings', path: '/settings' },
  ];

  // Find matching route, considering dynamic parameters
  const findMatchingRoute = (pathname: string): RouteInfo | undefined => {
    // Try direct match first
    let matchedRoute = routes.find(route => route.path === pathname);
    
    // If no direct match, try with dynamic paths
    if (!matchedRoute) {
      matchedRoute = routes.find(route => {
        if (!route.isDynamic) return false;
        
        // Convert route pattern to regex for matching
        const pattern = route.path.replace(/:(\w+)/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathname);
      });
    }
    
    return matchedRoute;
  };

  // Extract the dynamic path parameters
  const extractPathParams = (routePath: string, actualPath: string): Record<string, string> => {
    const paramNames: string[] = [];
    // Extract param names from route definition
    routePath.replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    // Create regex to extract actual values
    const pattern = routePath.replace(/:(\w+)/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);
    const matches = actualPath.match(regex);
    
    if (!matches) return {};
    
    // Skip the first match (full string)
    const paramValues = matches.slice(1);
    
    // Combine param names with their values
    return paramNames.reduce((acc, paramName, index) => {
      acc[paramName] = paramValues[index];
      return acc;
    }, {} as Record<string, string>);
  };

  // Build breadcrumb segments
  const buildBreadcrumbSegments = (pathname: string) => {
    // Split path and build up segments
    const pathSegments = pathname.split('/').filter(Boolean);
    
    let segments: { path: string; title: string; isLast: boolean }[] = [];
    let currentPath = '';
    
    // Always include Home at root level
    segments.push({
      path: '/dashboard',
      title: 'Home',
      isLast: pathSegments.length === 0,
    });
    
    // Build segments incrementally
    for (let i = 0; i < pathSegments.length; i++) {
      currentPath += `/${pathSegments[i]}`;
      
      // Try to find matching defined route
      const matchedRoute = findMatchingRoute(currentPath);
      const isLast = i === pathSegments.length - 1;
      
      if (matchedRoute) {
        // For dynamic routes, use the fetched name if available
        if (matchedRoute.isDynamic && matchedRoute.entityType) {
          const params = extractPathParams(matchedRoute.path, currentPath);
          const entityId = params[matchedRoute.entityType.substring(0, matchedRoute.entityType.indexOf('e') + 1) + '_id'] || params.id;
          
          if (entityId && dynamicNames[entityId]) {
            segments.push({
              path: currentPath,
              title: dynamicNames[entityId],
              isLast,
            });
          } else {
            segments.push({
              path: currentPath,
              title: matchedRoute.title,
              isLast,
            });
          }
        } else {
          segments.push({
            path: currentPath,
            title: matchedRoute.title,
            isLast,
          });
        }
      } else {
        // Use capitalized path segment name as fallback
        segments.push({
          path: currentPath,
          title: pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1),
          isLast,
        });
      }
    }
    
    return segments;
  };

  // Fetch entity names for dynamic routes
  React.useEffect(() => {
    const fetchEntityNames = async () => {
      // Identify which dynamic entities we need to fetch names for
      const entitiesToFetch: { type: string; id: string; getter: (id: string) => Promise<string> }[] = [];
      
      // Find matching route
      const currentRoute = findMatchingRoute(location.pathname);
      
      if (currentRoute?.isDynamic && currentRoute.getEntityName) {
        const pathParams = extractPathParams(currentRoute.path, location.pathname);
        const id = pathParams.id;
        
        if (id && !dynamicNames[id]) {
          entitiesToFetch.push({
            type: currentRoute.entityType || 'unknown',
            id,
            getter: currentRoute.getEntityName,
          });
        }
      }
      
      // If we have entities to fetch, get their names
      if (entitiesToFetch.length > 0) {
        setLoading(true);
        
        const namePromises = entitiesToFetch.map(async entity => {
          try {
            const name = await entity.getter(entity.id);
            return { id: entity.id, name };
          } catch (error) {
            console.error(`Failed to fetch name for ${entity.type} ${entity.id}:`, error);
            return { id: entity.id, name: `${entity.type} Details` };
          }
        });
        
        const results = await Promise.all(namePromises);
        
        setDynamicNames(prev => {
          const newNames = { ...prev };
          results.forEach(result => {
            newNames[result.id] = result.name;
          });
          return newNames;
        });
        
        setLoading(false);
      }
    };
    
    fetchEntityNames();
  }, [location.pathname]);

  // Don't show breadcrumbs on home page
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  const breadcrumbSegments = buildBreadcrumbSegments(location.pathname);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {breadcrumbSegments.slice(1).map((segment, index) => (
          <React.Fragment key={segment.path}>
            {segment.isLast ? (
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {segment.title}
                  {loading && index === breadcrumbSegments.length - 2 && '...'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={segment.path}>{segment.title}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNavigation;
