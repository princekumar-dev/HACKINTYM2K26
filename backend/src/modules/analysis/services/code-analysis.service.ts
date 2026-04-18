import { Injectable } from '@nestjs/common';
import * as traverse from '@babel/traverse';
import * as parser from '@babel/parser';
import * as t from '@babel/types';

interface ComplexityAnalysis {
  cyclomaticComplexity: number;
  halsteadComplexity: number;
  maintainabilityIndex: number;
}

@Injectable()
export class CodeAnalysisService {
  async analyzeCode(code: string, language: string = 'javascript') {
    try {
      // Parse code into AST
      const ast = this.parseCode(code);

      // Extract metrics
      const lineCount = code.split('\n').length;
      const functionCount = this.countFunctions(ast);
      const dependencies = this.extractDependencies(ast);
      const complexity = this.calculateComplexity(ast, code);
      const issues = this.detectIssues(ast, code);
      const issues_found = await this.analyzeIssues(code);

      // Calculate scores
      const healthScore = this.calculateHealthScore(issues_found, lineCount);
      const performanceScore = this.calculatePerformanceScore(complexity);
      const maintainabilityScore = this.calculateMaintainabilityScore(
        complexity,
        lineCount,
        dependencies.length,
      );

      // Generate suggestions
      const suggestions = this.generateSuggestions(
        issues_found,
        complexity,
        performanceScore,
        healthScore,
      );

      return {
        code,
        language,
        complexity: complexity.cyclomaticComplexity,
        healthScore,
        performanceScore,
        maintainabilityScore,
        issues: issues_found,
        suggestions,
        lineCount,
        functionCount,
        dependencies,
        metrics: {
          cyclomaticComplexity: complexity.cyclomaticComplexity,
          halsteadComplexity: complexity.halsteadComplexity,
          maintainabilityIndex: complexity.maintainabilityIndex,
          linesOfCode: lineCount,
          commentRatio: this.calculateCommentRatio(code),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        code,
        language,
        complexity: 0,
        healthScore: 0,
        performanceScore: 0,
        maintainabilityScore: 0,
        issues: [`Parse error: ${error.message}`],
        suggestions: [
          'Fix syntax errors in the code',
          'Ensure code is valid JavaScript/TypeScript',
        ],
        lineCount: code.split('\n').length,
        functionCount: 0,
        dependencies: [],
        metrics: {
          cyclomaticComplexity: 0,
          halsteadComplexity: 0,
          maintainabilityIndex: 0,
          linesOfCode: code.split('\n').length,
          commentRatio: 0,
        },
        timestamp: new Date(),
      };
    }
  }

  private parseCode(code: string) {
    try {
      return parser.parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ['jsx', 'typescript', 'decorators', 'classProperties'],
      });
    } catch {
      return parser.parse(code, {
        sourceType: 'script',
        plugins: ['jsx'],
      });
    }
  }

  private countFunctions(ast: any): number {
    let count = 0;
    traverse.default(ast, {
      FunctionDeclaration() {
        count++;
      },
      FunctionExpression() {
        count++;
      },
      ArrowFunctionExpression() {
        count++;
      },
      MethodDefinition() {
        count++;
      },
    });
    return count;
  }

  private extractDependencies(ast: any): string[] {
    const deps = new Set<string>();
    traverse.default(ast, {
      ImportDeclaration(path) {
        deps.add(path.node.source.value);
      },
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee, { name: 'require' }) &&
          path.node.arguments.length > 0
        ) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            deps.add(arg.value);
          }
        }
      },
    });
    return Array.from(deps);
  }

  private calculateComplexity(ast: any, code: string): ComplexityAnalysis {
    let cyclomaticComplexity = 1;
    let halsteadOperators = 0;
    let halsteadOperands = 0;

    traverse.default(ast, {
      IfStatement() {
        cyclomaticComplexity++;
      },
      ConditionalExpression() {
        cyclomaticComplexity++;
      },
      WhileStatement() {
        cyclomaticComplexity++;
      },
      DoWhileStatement() {
        cyclomaticComplexity++;
      },
      ForStatement() {
        cyclomaticComplexity++;
      },
      ForInStatement() {
        cyclomaticComplexity++;
      },
      ForOfStatement() {
        cyclomaticComplexity++;
      },
      CatchClause() {
        cyclomaticComplexity++;
      },
      LogicalExpression() {
        halsteadOperators++;
      },
      BinaryExpression() {
        halsteadOperators++;
      },
      Identifier() {
        halsteadOperands++;
      },
    });

    const linesOfCode = code.split('\n').length;
    const maintainabilityIndex = Math.max(
      0,
      171 -
        5.2 * Math.log(halsteadOperators) -
        0.23 * cyclomaticComplexity -
        16.2 * Math.log(linesOfCode),
    );

    return {
      cyclomaticComplexity,
      halsteadComplexity: Math.sqrt(halsteadOperators * halsteadOperands),
      maintainabilityIndex: Math.min(100, maintainabilityIndex),
    };
  }

  private detectIssues(ast: any, code: string): string[] {
    const issues: string[] = [];

    traverse.default(ast, {
      VariableDeclarator(path) {
        // Detect unused variables (simplified)
        const name = path.node.id;
        if (t.isIdentifier(name)) {
          const binding = path.scope.getBinding(name.name);
          if (binding && binding.referencePaths.length === 0) {
            issues.push(`Potentially unused variable: ${name.name}`);
          }
        }
      },
      FunctionDeclaration(path) {
        // Check function length
        const length = path.node.end - path.node.start;
        if (length > 500) {
          issues.push(
            `Function ${path.node.id?.name || 'anonymous'} is too long (${length} chars)`,
          );
        }
      },
    });

    // Check for console logs
    if (code.includes('console.log')) {
      issues.push('Remove console.log statements in production code');
    }

    // Check for TODO comments
    if (code.includes('TODO') || code.includes('FIXME')) {
      issues.push('Code contains TODO/FIXME comments that need resolution');
    }

    return issues;
  }

  private async analyzeIssues(code: string): Promise<string[]> {
    const issues: string[] = [];

    // Performance issues
    if (
      code.includes('eval(') ||
      code.includes('Function(') ||
      code.includes('setTimeout')
    ) {
      issues.push('Potential performance issue: Using eval or Function constructor');
    }

    // Security issues
    if (
      code.includes('innerHTML') ||
      code.includes('eval(') ||
      code.includes('exec(')
    ) {
      issues.push('Security issue: Potential XSS vulnerability detected');
    }

    // Memory leaks
    if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
      issues.push('Potential memory leak: Missing event listener removal');
    }

    // Async/await issues
    if (
      code.includes('async') &&
      code.includes('await') &&
      !code.includes('try')
    ) {
      issues.push('Error handling: Missing try-catch in async function');
    }

    return issues;
  }

  private calculateHealthScore(issues: string[], lineCount: number): number {
    let score = 100;

    // Deduct points for each issue
    score -= issues.length * 10;

    // Deduct for very long files
    if (lineCount > 500) score -= 20;
    else if (lineCount > 300) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformanceScore(complexity: ComplexityAnalysis): number {
    let score = 100;

    if (complexity.cyclomaticComplexity > 15) score -= 30;
    else if (complexity.cyclomaticComplexity > 10) score -= 15;

    if (complexity.halsteadComplexity > 100) score -= 20;
    else if (complexity.halsteadComplexity > 50) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateMaintainabilityScore(
    complexity: ComplexityAnalysis,
    lineCount: number,
    dependencyCount: number,
  ): number {
    let score = complexity.maintainabilityIndex;

    // Adjust for file size
    if (lineCount > 500) score -= 15;
    else if (lineCount > 300) score -= 7;

    // Adjust for dependencies
    if (dependencyCount > 10) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateCommentRatio(code: string): number {
    const lines = code.split('\n');
    const commentLines = lines.filter((line) =>
      line.trim().startsWith('//') || line.trim().startsWith('/*'),
    ).length;
    return lines.length > 0 ? (commentLines / lines.length) * 100 : 0;
  }

  private generateSuggestions(
    issues: string[],
    complexity: ComplexityAnalysis,
    performanceScore: number,
    healthScore: number,
  ): string[] {
    const suggestions: string[] = [];

    if (complexity.cyclomaticComplexity > 15) {
      suggestions.push('Refactor: Function complexity is too high. Break into smaller functions.');
    }

    if (performanceScore < 50) {
      suggestions.push(
        'Performance concern: Consider optimizing algorithms and removing bottlenecks.',
      );
    }

    if (healthScore < 50) {
      suggestions.push('Code quality is poor. Address detected issues and add error handling.');
    }

    if (issues.length > 0) {
      suggestions.push(`Fix ${issues.length} detected issues`);
    }

    if (complexity.maintainabilityIndex < 50) {
      suggestions.push(
        'Maintainability is low: Add comments, refactor long functions, and improve naming.',
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('Code quality is good. Keep up the standards!');
    }

    return suggestions;
  }
}
